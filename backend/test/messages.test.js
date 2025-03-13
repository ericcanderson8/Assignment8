import {
  it, describe, beforeAll, afterAll, expect, beforeEach, vi,
} from 'vitest';
import supertest from 'supertest';
import http from 'http';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

// Mock jwt verify function to always succeed with a test user
vi.mock('jsonwebtoken', () => ({
  verify: vi.fn().mockReturnValue({
    id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
    email: 'test@example.com',
    name: 'Test User',
  }),
  sign: vi.fn().mockReturnValue('fake-jwt-token'),
}));

// Import routes to access setTestPool
import {setTestPool} from '../src/routes.js';

// Mock the auth check middleware to bypass authentication
vi.mock('../src/auth.js', async () => {
  return {
    check: (req, res, next) => {
      // Add test user to req with valid UUID
      req.user = {
        id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        email: 'test@example.com',
        name: 'Test User',
      };
      next();
    },
    login: vi.fn(),
    register: vi.fn(),
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
  testDbName = process.env.POSTGRES_DB;
} else {
  // Use a test-specific database
  testDbName = `${process.env.POSTGRES_DB}_test_messages`;
}

let server;
let request;
let userId;
let workspaceId;
let channelId;
let otherUserId;
let testPool;

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

    // Create our test pool that will be used for all queries
    testPool = new pg.Pool({
      host: 'localhost',
      port: 5432,
      database: testDbName,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });

    // Set the test pool for use in routes.js
    setTestPool(testPool);
    // console.log('Test pool has been set for routes.js');
  } catch (err) {
    console.error('Error setting up test database:', err);
  }
};

beforeAll(async () => {
  // Create test database if needed
  await setupTestDb();

  server = http.createServer(app);
  server.listen();
  request = supertest(server);
});

afterAll((done) => {
  testPool.end();
  server.close(done);
});

// Initialize database and create test data before each test
beforeEach(async () => {
  // Skip database reset if running e2e tests
  if (process.env.E2E_TEST === 'true') {
    return;
  }
  try {
    // First drop all tables with CASCADE to handle dependencies
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

    // Create test users - use hardcoded UUIDs for consistency
    userId = '123e4567-e89b-12d3-a456-426614174000';
    otherUserId = '223e4567-e89b-12d3-a456-426614174000';

    await testPool.query(`
      INSERT INTO users (id, data) VALUES ($1, $2)
    `, [userId, {
      email: 'test@example.com',
      password: '5f4dcc3b5aa765d61d8327deb882cf99', // 'password'
      name: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString(),
      currentWorkspace: null,
      currentChannel: null,
      online: true,
    }]);

    await testPool.query(`
      INSERT INTO users (id, data) VALUES ($1, $2)
    `, [otherUserId, {
      email: 'other@example.com',
      password: '5f4dcc3b5aa765d61d8327deb882cf99', // 'password'
      name: 'Other User',
      role: 'user',
      createdAt: new Date().toISOString(),
      currentWorkspace: null,
      currentChannel: null,
      online: true,
    }]);

    // Create test workspace with hardcoded UUID
    workspaceId = '323e4567-e89b-12d3-a456-426614174000';
    await testPool.query(`
      INSERT INTO workspaces (id, creator_id, data) VALUES ($1, $2, $3)
    `, [workspaceId, userId, {
      name: 'Test Workspace',
      createdAt: new Date().toISOString(),
    }]);

    // Add users to workspace
    await testPool.query(`
      INSERT INTO workspace_users (workspace_id, user_id, data)
       VALUES ($1, $2, $3)
    `, [workspaceId, userId, {role: 'admin'}]);

    await testPool.query(`
      INSERT INTO workspace_users (workspace_id, user_id, data)
       VALUES ($1, $2, $3)
    `, [workspaceId, otherUserId, {role: 'member'}]);

    // Create test channel with hardcoded UUID
    channelId = '423e4567-e89b-12d3-a456-426614174000';
    await testPool.query(`
      INSERT INTO channels (id, workspace_id, data) VALUES ($1, $2, $3)
    `, [channelId, workspaceId, {name: 'Test Channel'}]);

    // Create some test messages
    await testPool.query(`
      INSERT INTO messages (channel_id, user_id, data) VALUES ($1, $2, $3)
    `, [channelId, userId, {
      message: 'Hello from Test User!',
      timestamp: new Date().toISOString(),
    }]);

    await testPool.query(`
      INSERT INTO messages (channel_id, user_id, data) VALUES ($1, $2, $3)
    `, [channelId, otherUserId, {
      message: 'Hello from Other User!',
      timestamp: new Date().toISOString(),
    }]);

    // Create some test DMs
    await testPool.query(`
      INSERT INTO dms (sender_id, receiver_id, data) VALUES ($1, $2, $3)
    `, [userId, otherUserId, {
      content: 'Hello from Test User!',
      timestamp: new Date().toISOString(),
    }]);

    await testPool.query(`
      INSERT INTO dms (sender_id, receiver_id, data) VALUES ($1, $2, $3)
    `, [otherUserId, userId, {
      content: 'Hello from Other User!',
      timestamp: new Date().toISOString(),
    }]);
  } catch (error) {
    console.error('Error initializing test setup:', error);
  }
});

describe('Channel Messages API', () => {
  it('should get messages for a channel', async () => {
    const response = await request
        .get(`/api/v0/channels/${channelId}/messages`)
        .set('Authorization', `Bearer fake-token`);

    // console.log('GET channel messages response:', {
    //   status: response.status,
    //   body: response.body,
    //   channelId: channelId,
    // });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    // Verify message structure
    const message = response.body[0];
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('content');
    expect(message).toHaveProperty('sender');
    expect(message).toHaveProperty('timestamp');
    expect(message).toHaveProperty('userId');
  }, 5000); // Increase timeout

  it('should return 404 for a non-existent channel', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request
        .get(`/api/v0/channels/${nonExistentId}/messages`)
        .set('Authorization', `Bearer fake-token`);

    expect(response.status).toBe(404);
  }, 5000); // Increase timeout

  it('should send a message to a channel', async () => {
    const messageContent = 'This is a test message';
    const response = await request
        .post(`/api/v0/channels/${channelId}/messages`)
        .set('Authorization', `Bearer fake-token`)
        .send({content: messageContent});

    // console.log('POST channel message response:', {
    //   status: response.status,
    //   body: response.body,
    //   channelId: channelId,
    // });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.content).toBe(messageContent);
    expect(response.body).toHaveProperty('sender');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('userId');

    // Verify the message was actually saved
    const messagesResponse = await request
        .get(`/api/v0/channels/${channelId}/messages`)
        .set('Authorization', `Bearer fake-token`);

    const savedMessage = messagesResponse.body.find(
        (msg) => msg.content === messageContent);
    expect(savedMessage).not.toBeUndefined();
  }, 5000); // Increase timeout

  it('should reject sending a message to a non-existent channel', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request
        .post(`/api/v0/channels/${nonExistentId}/messages`)
        .set('Authorization', `Bearer fake-token`)
        .send({content: 'Test message'});

    expect(response.status).toBe(404);
  }, 5000); // Increase timeout
});

describe('Direct Messages API', () => {
  it('should get direct messages between users', async () => {
    const response = await request
        .get(`/api/v0/dm/${otherUserId}/messages`)
        .set('Authorization', `Bearer fake-token`);

    // console.log('GET DM messages response:', {
    //   status: response.status,
    //   body: response.body,
    //   otherUserId: otherUserId,
    // });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // If there are messages, verify structure
    if (response.body.length > 0) {
      const message = response.body[0];
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('sender');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('userId');
    }
  }, 5000); // Increase timeout

  it('should return 404 for a non-existent user', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request
        .get(`/api/v0/dm/${nonExistentId}/messages`)
        .set('Authorization', `Bearer fake-token`);

    expect(response.status).toBe(404);
  }, 5000); // Increase timeout

  it('should send a direct message to another user', async () => {
    const messageContent = 'This is a test DM';
    const response = await request
        .post(`/api/v0/dm/${otherUserId}/messages`)
        .set('Authorization', `Bearer fake-token`)
        .send({content: messageContent});

    // console.log('POST DM message response:', {
    //   status: response.status,
    //   body: response.body,
    //   otherUserId: otherUserId,
    // });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.content).toBe(messageContent);
    expect(response.body).toHaveProperty('sender');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('userId');

    // Verify the message was actually saved
    const messagesResponse = await request
        .get(`/api/v0/dm/${otherUserId}/messages`)
        .set('Authorization', `Bearer fake-token`);

    const savedMessage = messagesResponse.body.find(
        (msg) => msg.content === messageContent);
    expect(savedMessage).not.toBeUndefined();
  }, 5000); // Increase timeout

  it('should reject sending a message to a non-existent user', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request
        .post(`/api/v0/dm/${nonExistentId}/messages`)
        .set('Authorization', `Bearer fake-token`)
        .send({content: 'Test message'});

    expect(response.status).toBe(404);
  }, 5000); // Increase timeout
});

describe('Authentication Requirements', () => {
  it(`should reject channel message requests
     without authentication`, async () => {
    const response = await request
        .get(`/api/v0/channels/${channelId}/messages`);
    expect(response.status).toBe(401);
  });

  it(`should reject sending channel messages
     without authentication`, async () => {
    const response = await request
        .post(`/api/v0/channels/${channelId}/messages`)
        .send({content: 'Unauthorized message'});
    expect(response.status).toBe(401);
  });

  it('should reject DM requests without authentication', async () => {
    const response = await request
        .get(`/api/v0/dm/${otherUserId}/messages`);
    expect(response.status).toBe(401);
  });

  it('should reject sending DMs without authentication', async () => {
    const response = await request
        .post(`/api/v0/dm/${otherUserId}/messages`)
        .send({content: 'Unauthorized message'});
    expect(response.status).toBe(401);
  });
});
