import {
  it, beforeAll, afterAll, expect, describe, beforeEach, vi,
} from 'vitest';
import supertest from 'supertest';
import http from 'http';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// Mock the pool in auth.js - this must be before importing app
vi.mock('../src/auth.js', async (importOriginal) => {
  const actual = await importOriginal();
  // Create a mock pool that will be replaced in beforeAll
  const mockPool = {
    query: vi.fn(),
    end: vi.fn(),
  };
  return {
    ...actual,
    pool: mockPool,
  };
});

// Now import app after the mock is set up
import app from '../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Create a separate test database name
let testDbName;
if (process.env.E2E_TEST === 'true') {
  // Use the main database for e2e tests
  testDbName = process.env.POSTGRES_DB || 'dev';
} else {
  // Use a test database for unit tests
  testDbName = process.env.TEST_POSTGRES_DB || 'dev_test';
}

// Use a test-specific database to avoid affecting the main database
const testPool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: testDbName,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

let server;
let request;

// Create a test database if it doesn't exist
const setupTestDb = async () => {
  try {
    // Connect to postgres to create the test database if it doesn't exist
    const pgPool = new pg.Pool({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });

    // Check if the test database exists
    const result = await pgPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [testDbName],
    );

    // Create the test database if it doesn't exist
    if (result.rows.length === 0) {
      await pgPool.query(`CREATE DATABASE ${testDbName}`);
    }

    await pgPool.end();
  } catch (err) {
    console.error('Error setting up test database:', err);
  }
};

beforeAll(async () => {
  // Create test database if needed
  await setupTestDb();

  // Replace the mock pool with the real test pool
  const auth = await import('../src/auth.js');
  Object.defineProperty(auth, 'pool', {
    value: testPool,
    writable: true,
  });

  server = http.createServer(app);
  server.listen();
  request = supertest(server);
});

afterAll((done) => {
  testPool.end();
  server.close(done);
});

// Test user data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User',
};

describe('Authentication', () => {
  beforeEach(async () => {
    // Skip database reset if running e2e tests
    if (process.env.E2E_TEST === 'true') {
      return;
    }

    // Reset database before each test
    try {
      await testPool.query(`
        DROP TABLE IF EXISTS messages CASCADE;
        DROP TABLE IF EXISTS channels CASCADE;
        DROP TABLE IF EXISTS workspace_users CASCADE;
        DROP TABLE IF EXISTS workspaces CASCADE;
        DROP TABLE IF EXISTS dms CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);

      // Read schema SQL
      const schemaFile = path.join(__dirname, '../sql/schema.sql');
      const schema = fs.readFileSync(schemaFile, 'utf8');

      // Execute schema SQL
      await testPool.query(schema);

      // Ensure the test user doesn't exist
      await testPool.query(
          'DELETE FROM users WHERE data->>\'email\' = $1',
          [testUser.email],
      );
    } catch (err) {
      console.error('Error in beforeEach:', err);
    }
  });

  it('should register a new user successfully', async () => {
    // Create a unique test user for this test
    const uniqueTestUser = {
      email: `test-register-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    };

    const response = await request
        .post('/api/v0/register')
        .send(uniqueTestUser);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');
  });

  it('should reject registration with duplicate email', async () => {
    // Create a unique test user for this test
    const uniqueTestUser = {
      email: `test-duplicate-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    };

    // First register a user
    const firstResponse = await request
        .post('/api/v0/register')
        .send(uniqueTestUser);

    expect(firstResponse.status).toBe(201);

    // Try to register again with the same email
    const response = await request
        .post('/api/v0/register')
        .send(uniqueTestUser);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('User with this email already exists');
  });

  it('should login successfully with correct credentials', async () => {
    // Create a unique test user for this test
    const uniqueTestUser = {
      email: `test-login-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    };

    // Register a user
    const registerResponse = await request
        .post('/api/v0/register')
        .send(uniqueTestUser);

    expect(registerResponse.status).toBe(201);

    const response = await request
        .post('/api/v0/login')
        .send({
          email: uniqueTestUser.email,
          password: uniqueTestUser.password,
        });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.name).toBe(uniqueTestUser.name);
  });

  it('should reject login with incorrect password', async () => {
    // Create a unique test user for this test
    const uniqueTestUser = {
      email: `test-wrong-password-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    };

    // Register a user
    const registerResponse = await request
        .post('/api/v0/register')
        .send(uniqueTestUser);

    expect(registerResponse.status).toBe(201);

    const response = await request
        .post('/api/v0/login')
        .send({
          email: uniqueTestUser.email,
          password: 'wrongpassword',
        });

    expect(response.status).toBe(401);
    // The error message is sent as plain text, not JSON
    expect(response.text).toBe('Invalid credentials');
  });

  it('should reject login with non-existent email', async () => {
    const response = await request
        .post('/api/v0/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
});
