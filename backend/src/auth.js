import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
// import path from 'node:path';
// import {fileURLToPath} from 'node:url';
import pg from 'pg';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();

// For e2e tests, always use the main database
// let dbName = process.env.POSTGRES_DB || 'dev';
// if (process.env.E2E_TEST === 'true') {
//   dbName = process.env.POSTGRES_DB;
// }
const dbName = process.env.POSTGRES_DB;

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: dbName,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

/**
 * Authenticates user with email and password
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with token or error
 */
export async function login(req, res) {
  const {email, password} = req.body;

  const result = await pool.query(
      'SELECT id, data FROM users WHERE data->>\'email\' = $1',
      [email],
  );

  if (result.rows.length === 0) {
    return res.status(401).json({error: 'Invalid credentials'});
  }

  const user = result.rows[0].data;

  if (verifyPassword(password, user.password)) {
    const accessToken = jwt.sign(
        {email: user.email, role: user.role, id: result.rows[0].id},
        process.env.SECRET, {
          expiresIn: '14d',
          algorithm: 'HS256',
        });
    res.status(200).json({name: user.name,
      accessToken: accessToken,
      id: result.rows[0].id,
    });
  } else {
    res.status(401).send('Invalid credentials');
  }
}

/**
 * Middleware to verify JWT token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {object} next - Express next middleware function
 * @returns {Promise<void>} - Calls next middleware or sends error response
 */
export async function check(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader.split(' ')[1];

  const decoded = jwt.verify(token, process.env.SECRET);
  req.user = decoded;
  // For endpoints that expect userId in the body, add it from the token
  // This ensures the OpenAPI validator is satisfied while maintaining
  // security
  if (req.path === '/api/v0/workspaces' && req.method === 'POST') {
    req.body.userId = decoded.id;
  }

  if (req.path === '/api/v0/workspaces' && req.method === 'GET') {
    req.body.userId = decoded.id;
  }
  next();
}

/**
 * Creates a new user account
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function register(req, res) {
  const {email, password, name, role = 'user'} = req.body;

  // Check if user already exists
  const existingUser = await pool.query(
      'SELECT data FROM users WHERE data->>\'email\' = $1',
      [email],
  );

  if (existingUser.rows.length > 0) {
    return res.status(409)
        .json({error: 'User with this email already exists'});
  }

  // Hash password
  const hashedPassword = hashPassword(password);
  // console.log('hashedPassword', hashedPassword);

  // Create user object
  const userData = {
    email,
    password: hashedPassword,
    name,
    role,
    createdAt: new Date().toISOString(),
    currentWorkspace: null,
    currentChannel: null,
    online: false,
  };

  // Insert user into database
  await pool.query(
      'INSERT INTO users (data) VALUES ($1)',
      [userData],
  );

  res.status(201).json({message: 'User registered successfully'});
}

/**
 * Hashes a password using PBKDF2
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password with salt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Stored password hash with salt
 * @returns {boolean} - Whether password matches
 */
function verifyPassword(password, hashedPassword) {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
}

// // POST /api/v0/workspaces
// /**
//  * Creates a new workspace
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function createWorkspace(req, res) {
//   const {name, description} = req.body;
//   const userId = req.user.id;

//   const workspaceData = {
//     name,
//     description,
//     createdAt: new Date().toISOString(),
//   };

//   const result = await pool.query(
//       'INSERT INTO workspaces (user_id, data) VALUES ($1, $2) RETURNING id',
//       [userId, workspaceData],
//   );
//   // return the primary key of the workspace
//   const workspaceId = result.rows[0].id;
//   await pool.query(
//       'INSERT INTO workspace_users (workspace_id, user_id) VALUES ($1, $2)',
//       [workspaceId, userId],
//   );

//   res.status(201).json({message: 'Workspace created successfully'});
// };

// // GET /api/v0/workspaces
// /**
//  * Gets all workspaces for a user
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function getWorkspaces(req, res) {
//   // Get userId from the JWT token instead of URL params
//   const userId = req.user.id;

//   // Use a join to get all workspaces
//   //  where the user is either the creator or a member
//   const query = `
//     SELECT w.id, w.data
//     FROM workspaces w
//     LEFT JOIN workspace_users wu ON w.id = wu.workspace_id
//     WHERE w.user_id = $1 OR wu.user_id = $1
//   `;
//   const result = await pool.query(query, [userId]);

//   res.status(200).json(result.rows);
// };

// // POST /api/v0/workspaces/users
// /**
//  * Adds a user to a workspace
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function addUserToWorkspace(req, res) {
//   const {workspaceId, userId} = req.body;

//   await pool.query(
//       'INSERT INTO workspace_users (workspace_id, user_id) VALUES ($1, $2)',
//       [workspaceId, userId],
//   );

//   res.status(201).json({message: 'User added to workspace successfully'});
// };

// // GET /api/v0/workspaces/users/:workspaceId
// /**
//  * Gets all users for a workspace
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function getUsersForWorkspace(req, res) {
//   const {workspaceId} = req.params;

//   const result = await pool.query(
//       `SELECT u.id, u.data
//        FROM workspace_users wu
//        JOIN users u ON wu.user_id = u.id
//        WHERE wu.workspace_id = $1`,
//       [workspaceId],
//   );

//   res.status(200).json(result.rows);
// };

// // POST /api/v0/workspaces/channels
// /**
//  * Creates a new channel
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function createChannel(req, res) {
//   const {workspaceId, name, description, admin} = req.body;

//   const channelData = {
//     name,
//     description,
//     admin,
//     createdAt: new Date().toISOString(),
//   };

//   await pool.query(
//       'INSERT INTO channels (workspace_id, data) VALUES ($1, $2)',
//       [workspaceId, channelData],
//   );

//   res.status(201).json({message: 'Channel created successfully'});
// };

// // GET /api/v0/workspaces/channels
// /**
//  * Gets all channels for a workspace
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function getChannels(req, res) {
//   const {workspaceId} = req.query;

//   const result = await pool.query(
//       'SELECT id, data FROM channels WHERE workspace_id = $1',
//       [workspaceId],
//   );

//   res.status(200).json(result.rows);
// };

// // POST /api/v0/workspaces/channels/messages
// /**
//  * Creates a new message
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function createMessage(req, res) {
//   const {channelId, content, userId} = req.body;

//   const messageData = {
//     content,
//     senderId: userId, // Map userId to senderId for backward compatibility
//     createdAt: new Date().toISOString(),
//   };

//   await pool.query(
//       'INSERT INTO messages (channel_id, data) VALUES ($1, $2)',
//       [channelId, messageData],
//   );

//   res.status(201).json({message: 'Message created successfully'});
// };

// // GET /api/v0/workspaces/channels/messages/:channelId
// /**
//  * Gets all messages for a channel
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>}
//  - Sends JSON response with success message or error
//  */
// export async function getMessages(req, res) {
//   const {channelId} = req.params;

//   const result = await pool.query(
//       'SELECT data FROM messages WHERE channel_id = $1',
//       [channelId],
//   );

//   res.status(200).json(result.rows);
// };

// // GET /api/v0/users
// /**
//  * Gets all users (for development purposes only)
//  * @param {object} req - Express request object
//  * @param {object} res - Express response object
//  * @returns {Promise<void>} - Sends JSON response with all users
//  */
// export async function getAllUsers(req, res) {
//   const result = await pool.query(
//       'SELECT id, data FROM users',
//   );

//   // Remove sensitive information like passwords
//   const users = result.rows.map((row) => {
//     const userData = {...row.data};
//     delete userData.password;
//     return {
//       id: row.id,
//       data: userData,
//     };
//   });

//   res.status(200).json(users);
// };

