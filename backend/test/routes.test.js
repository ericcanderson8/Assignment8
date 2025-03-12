import {
  it, beforeAll, afterAll, expect, beforeEach, vi,
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
let authToken;
// let workspaceId;
// let channelId;

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

// Initialize database schema before each test
beforeEach(async () => {
  // Skip database reset if running e2e tests
  if (process.env.E2E_TEST === 'true') {
    return;
  }
  try {
    // Reset these variables for each test to ensure isolation
    // workspaceId = null;
    // channelId = null;

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

    // Create a test user and get auth token
    const testUser = {
      email: 'anna@books.com',
      password: 'annaadmin',
      name: 'Anna Admin',
    };

    // Register user
    // await request
    //     .post('/api/v0/register')
    //     .send(testUser);

    // Login to get token
    const loginResponse = await request
        .post('/api/v0/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

    authToken = loginResponse.body.accessToken;

    // Get user ID directly from database
    await testPool.query(
        'SELECT id FROM users WHERE data->>\'email\' = $1',
        [testUser.email],
    );

    // if (userResult.rows.length > 0) {
    //   userId = userResult.rows[0].id;
    // }
  } catch (error) {
    console.error('Error initializing test setup:', error);
  }
});

it('should get workspaces for the authenticated user', async () => {
  const response = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  expect(response.status).toBe(200);
});

it('should create a workspace successfully', async () => {
  let response = await request
      .post('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({name: 'Test Workspace'});
  expect(response.status).toBe(201);
  response = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  expect(response.status).toBe(200);
  expect(response.body.length).toBeGreaterThan(0);
  const hasTestWorkspace = response.body.some(
      (workspace) => workspace.name === 'Test Workspace',
  );
  expect(hasTestWorkspace).toBe(true);
});

it('should set the current workspace successfully', async () => {
  // Create a workspace
  const createResponse = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  expect(createResponse.status).toBe(200);
  console.log(createResponse.body);
  // Set the current workspace
  const response = await request
      .put('/api/v0/workspaces/current')
      .set('Authorization', `Bearer ${authToken}`)
      .send({workspaceId: createResponse.body[1].id});
  expect(response.status).toBe(200);
});

// New tests starting from getCurrentWorkspace

it('should get the current workspace for the authenticated user', async () => {
  // First create a workspace
  const createWorkspaceResponse = await request
      .post('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({name: 'Current Workspace Test'});
  expect(createWorkspaceResponse.status).toBe(201);

  // Get the workspace ID
  const getWorkspacesResponse = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  const workspaceId = getWorkspacesResponse.body.find(
      (workspace) => workspace.name === 'Current Workspace Test',
  )?.id;

  // Set it as the current workspace
  await request
      .put('/api/v0/workspaces/current')
      .set('Authorization', `Bearer ${authToken}`)
      .send({workspaceId});

  // Now get the current workspace
  const response = await request
      .get('/api/v0/workspaces/current')
      .set('Authorization', `Bearer ${authToken}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('currentWorkspace');
  expect(response.body.currentWorkspace).toBe(workspaceId);
});

it('should return 404 when no current workspace is set', async () => {
  // First ensure no workspace is set as current
  // This requires a new user with no workspace set

  // Register a new user
  const newUser = {
    email: `test-no-workspace-${Date.now()}@example.com`,
    password: 'password123',
    name: 'No Workspace User',
  };

  await request
      .post('/api/v0/register')
      .send(newUser);

  // Login with the new user
  const loginResponse = await request
      .post('/api/v0/login')
      .send({
        email: newUser.email,
        password: newUser.password,
      });

  const newAuthToken = loginResponse.body.accessToken;

  // Try to get current workspace (should fail)
  const response = await request
      .get('/api/v0/workspaces/current')
      .set('Authorization', `Bearer ${newAuthToken}`);

  expect(response.status).toBe(404);
  expect(response.body.message).toBe('No current workspace found');
});

it('should get channels for a workspace', async () => {
  // First create a workspace
  const createWorkspaceResponse = await request
      .post('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({name: 'Channels Test Workspace'});
  expect(createWorkspaceResponse.status).toBe(201);

  // Get the workspace ID
  const getWorkspacesResponse = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  const workspaceId = getWorkspacesResponse.body.find(
      (workspace) => workspace.name === 'Channels Test Workspace',
  )?.id;

  // Get channels (initially empty)
  const response = await request
      .get(`/api/v0/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${authToken}`);

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});

it('should create a channel in a workspace', async () => {
  // First create a workspace
  const createWorkspaceResponse = await request
      .post('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({name: 'Create Channel Test'});
  expect(createWorkspaceResponse.status).toBe(201);

  // Get the workspace ID
  const getWorkspacesResponse = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  const workspaceId = getWorkspacesResponse.body.find(
      (workspace) => workspace.name === 'Create Channel Test',
  )?.id;

  // Create a channel
  const createChannelResponse = await request
      .post(`/api/v0/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({name: 'Test Channel'});

  expect(createChannelResponse.status).toBe(201);

  // Verify the channel was created
  const getChannelsResponse = await request
      .get(`/api/v0/workspaces/${workspaceId}/channels`)
      .set('Authorization', `Bearer ${authToken}`);

  expect(getChannelsResponse.status).toBe(200);
  expect(Array.isArray(getChannelsResponse.body)).toBe(true);
  expect(getChannelsResponse.body.length).toBeGreaterThan(0);
  expect(getChannelsResponse.body[0].name).toBe('Test Channel');
});

it('should get users for a workspace', async () => {
  // First create a workspace
  const createWorkspaceResponse = await request
      .post('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({name: 'Users Test Workspace'});
  expect(createWorkspaceResponse.status).toBe(201);

  // Get the workspace ID
  const getWorkspacesResponse = await request
      .get('/api/v0/workspaces')
      .set('Authorization', `Bearer ${authToken}`);
  const workspaceId = getWorkspacesResponse.body.find(
      (workspace) => workspace.name === 'Users Test Workspace',
  )?.id;

  // Get users
  const response = await request
      .get(`/api/v0/workspaces/${workspaceId}/users`)
      .set('Authorization', `Bearer ${authToken}`);

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
  // At least the creator (admin) should be in the workspace
  expect(response.body[0]).toHaveProperty('name');
  expect(response.body[0]).toHaveProperty('id');
  expect(response.body[0]).toHaveProperty('online');
});

// describe('Workspace Routes', () => {
//   it('should create a workspace successfully', async () => {
//     const response = await request
//         .post('/api/v0/workspaces')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send({
//           name: 'Test Workspace',
//         });

//     expect(response.status).toBe(201);
//     expect(response.body.message).toBe('Workspace created successfully');

//     try {
//       // Get workspace ID directly from database
//       const workspaceResult = await testPool.query(
//           'SELECT id FROM workspaces WHERE data->>\'name\' = $1',
//           ['Test Workspace'],
//       );

//       if (workspaceResult.rows && workspaceResult.rows.length > 0) {
//         workspaceId = workspaceResult.rows[0].id;
//       }
//     } catch (error) {
//       console.error('Error querying workspace:', error);
//     }
//   });

//   it('should get workspaces for the authenticated user', async () => {
//     // First create a workspace
//     await request
//         .post('/api/v0/workspaces')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send({
//           name: 'Another Test Workspace',
//         });

//     const response = await request
//         .get('/api/v0/workspaces')
//         .set('Authorization', `Bearer ${authToken}`);

//     expect(response.status).toBe(200);
//     expect(Array.isArray(response.body)).toBe(true);
//     expect(response.body.length).toBeGreaterThan(0);
//     expect(response.body[0].data).toHaveProperty('name');
//   });

//   it('should reject workspace creation without authentication', async () => {
//     const response = await request
//         .post('/api/v0/workspaces')
//         .send({
//           name: 'Unauthorized Workspace',
//         });

//     expect(response.status).toBe(401);
//   });
// });

// describe('Workspace Users Routes', () => {
//   beforeEach(async () => {
//     try {
//       // Create a workspace for testing
//       const workspaceResponse = await request
//           .post('/api/v0/workspaces')
//           .set('Authorization', `Bearer ${authToken}`)
//           .send({
//             name: 'User Test Workspace',
//           });

//       expect(workspaceResponse.status).toBe(201);

//       // Get workspace ID directly from database
//       const workspaceResult = await testPool.query(
//           'SELECT id FROM workspaces WHERE data->>\'name\' = $1',
//           ['User Test Workspace'],
//       );

//       if (workspaceResult.rows && workspaceResult.rows.length > 0) {
//         workspaceId = workspaceResult.rows[0].id;
//       }

//       // Create another test user
//       const anotherUser = {
//         email: 'another-user@example.com',
//         password: 'anotherpassword123',
//         name: 'Another Test User',
//       };

//       // First clear any existing users with this email
//       await testPool.query(
//           'DELETE FROM users WHERE data->>\'email\' = $1',
//           [anotherUser.email],
//       );

//       await request.post('/api/v0/register').send(anotherUser);
//     } catch (error) {
//       console.error('Error in workspace users setup:', error);
//     }
//   });

//   it('should add a user to a workspace', async () => {
//     if (!workspaceId) {
//       return;
//     }

//     // Get the ID of the other user directly from database
//     const userResult = await testPool.query(
//         'SELECT id FROM users WHERE data->>\'email\' = $1',
//         ['another-user@example.com'],
//     );

//     if (userResult.rows.length === 0) {
//       return;
//     }

//     const otherUserId = userResult.rows[0].id;

//     const response = await request
//         .post('/api/v0/workspaces/users')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send({
//           workspaceId: workspaceId,
//           userId: otherUserId,
//         });

//     expect(response.status).toBe(201);
//     expect(response.body.message)
// .toBe('User added to workspace successfully');
//   });

//   it('should get users for a workspace', async () => {
//     if (!workspaceId) {
//       return;
//     }

//     const response = await request
//         .get(`/api/v0/workspaces/users/${workspaceId}`)
//         .set('Authorization', `Bearer ${authToken}`);

//     expect(response.status).toBe(200);
//     expect(Array.isArray(response.body)).toBe(true);
//   }, 5000); // Increase timeout for this test
// });

// describe('Channel Routes', () => {
//   beforeEach(async () => {
//     try {
//       // Create a workspace for testing
//       const workspaceResponse = await request
//           .post('/api/v0/workspaces')
//           .set('Authorization', `Bearer ${authToken}`)
//           .send({
//             name: 'Channel Test Workspace',
//           });

//       expect(workspaceResponse.status).toBe(201);

//       // Get workspace ID directly from database
//       const workspaceResult = await testPool.query(
//           'SELECT id FROM workspaces WHERE data->>\'name\' = $1',
//           ['Channel Test Workspace'],
//       );

//       console.log(workspaceResult);
//       console.log('authToken: ' + authToken);
//       if (workspaceResult.rows && workspaceResult.rows.length > 0) {
//         workspaceId = workspaceResult.rows[0].id;
//       }
//     } catch (error) {
//       console.error('Error in channel setup:', error);
//     }
//   });

//   it('should create a channel successfully', async () => {
//     if (!workspaceId) {
//       return;
//     }

//     const response = await request
//         .post('/api/v0/workspaces/channels')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send({
//           workspaceId: workspaceId,
//           name: 'Test Channel',
//           description: 'A test channel',
//           admin: 'admin-user',
//         });

//     expect(response.status).toBe(201);
//     expect(response.body.message).toBe('Channel created successfully');

//     try {
//       // Get channel ID directly from database
//       const channelResult = await testPool.query(
//           'SELECT id FROM channels WHERE data->>\'name\' = $1',
//           ['Test Channel'],
//       );

//       if (channelResult.rows && channelResult.rows.length > 0) {
//         channelId = channelResult.rows[0].id;
//       }
//     } catch (error) {
//       console.error('Error querying channel:', error);
//     }
//   });

//   it('should get channels for a workspace', async () => {
//     if (!workspaceId) {
//       return;
//     }

//     const response = await request
//         .get(`/api/v0/workspaces/channels?workspaceId=${workspaceId}`)
//         .set('Authorization', `Bearer ${authToken}`);

//     expect(response.status).toBe(200);
//     expect(Array.isArray(response.body)).toBe(true);
//   });
// });

// describe('Message Routes', () => {
//   beforeEach(async () => {
//     try {
//       // Create a workspace for testing
//       const workspaceResponse = await request
//           .post('/api/v0/workspaces')
//           .set('Authorization', `Bearer ${authToken}`)
//           .send({
//             name: 'Message Test Workspace',
//           });

//       expect(workspaceResponse.status).toBe(201);

//       // Get workspace ID directly from database
//       const workspaceResult = await testPool.query(
//           'SELECT id FROM workspaces WHERE data->>\'name\' = $1',
//           ['Message Test Workspace'],
//       );

//       if (workspaceResult.rows && workspaceResult.rows.length > 0) {
//         workspaceId = workspaceResult.rows[0].id;
//       } else {
//         return; // Skip further setup if workspace not found
//       }

//       // Create a channel
//       const channelResponse = await request
//           .post('/api/v0/channels')
//           .set('Authorization', `Bearer ${authToken}`)
//           .send({
//             workspaceId: workspaceId,
//             name: 'Test Channel',
//           });

//       expect(channelResponse.status).toBe(201);

//       // Get channel ID directly from database
//       const channelResult = await testPool.query(
//           'SELECT id FROM channels WHERE data->>\'name\' = $1',
//           ['Test Channel'],
//       );

//       if (channelResult.rows && channelResult.rows.length > 0) {
//         channelId = channelResult.rows[0].id;
//       }
//     } catch (error) {
//       console.error('Error in message setup:', error);
//     }
//   });

//   it('should create a message successfully', async () => {
//     if (!channelId) {
//       return;
//     }

//     // Get the current user's ID for the userId
//     const userResult = await testPool.query(
//         'SELECT id FROM users WHERE data->>\'email\' = $1',
//         ['routes-test@example.com'],
//     );

//     let userId;
//     if (userResult.rows.length > 0) {
//       userId = userResult.rows[0].id;
//     } else {
//       // Skip test if we can't get the user ID
//       return;
//     }

//     const response = await request
//         .post('/api/v0/workspaces/channels/messages')
//         .set('Authorization', `Bearer ${authToken}`)
//         .send({
//           channelId: channelId,
//           content: 'Test message content',
//           userId: userId,
//         });

//     expect(response.status).toBe(201);
//     expect(response.body.message).toBe('Message created successfully');
//   });

//   it('should get messages for a channel', async () => {
//     if (!channelId) {
//       return;
//     }

//     // First create a message to ensure there's something to retrieve
//     // Get the current user's ID for the userId
//     const userResult = await testPool.query(
//         'SELECT id FROM users WHERE data->>\'email\' = $1',
//         ['routes-test@example.com'],
//     );

//     let userId;
//     if (userResult.rows.length > 0) {
//       userId = userResult.rows[0].id;

//       // Create a message
//       await request
//           .post('/api/v0/workspaces/channels/messages')
//           .set('Authorization', `Bearer ${authToken}`)
//           .send({
//             channelId: channelId,
//             content: 'Another test message',
//             userId: userId,
//           });
//     } else {
//       // Skip test if we can't get the user ID
//       return;
//     }

//     const response = await request
//         .get(`/api/v0/workspaces/channels/messages/${channelId}`)
//         .set('Authorization', `Bearer ${authToken}`);

//     expect(response.status).toBe(200);
//     expect(Array.isArray(response.body)).toBe(true);
//     // Now we should have at least one message
//     expect(response.body.length).toBeGreaterThan(0);
//   });
// });

// describe('Users Route (Development Only)', () => {
//   it('should get all users', async () => {
//     const response = await request
//         .get('/api/v0/users')
//         .set('Authorization', `Bearer ${authToken}`);

//     expect(response.status).toBe(200);
//     expect(Array.isArray(response.body)).toBe(true);
//     expect(response.body.length).toBeGreaterThan(0);
//     expect(response.body[0]).toHaveProperty('id');
//     expect(response.body[0]).toHaveProperty('data');
//     expect(response.body[0].data).toHaveProperty('name');
//     expect(response.body[0].data).toHaveProperty('email');
//     // Ensure password is not included
//     expect(response.body[0].data).not.toHaveProperty('password');
//   });

//   it('should reject users request without authentication', async () => {
//     const response = await request.get('/api/v0/users');
//     expect(response.status).toBe(401);
//   });
// });
