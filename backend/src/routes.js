import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.POSTGRES_DB;

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: dbName,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

// POST /api/v0/workspaces
/**
 * Creates a new workspace
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function createWorkspace(req, res) {
  const {name, description} = req.body;
  const userId = req.user.id;

  const workspaceData = {
    name,
    description,
    createdAt: new Date().toISOString(),
  };

  const result = await pool.query(
      'INSERT INTO workspaces (creator_id, data) VALUES ($1, $2) RETURNING id',
      [userId, workspaceData],
  );
  // return the primary key of the workspace
  const workspaceId = result.rows[0].id;
  await pool.query(
      `INSERT INTO workspace_users 
       (workspace_id, user_id, data) VALUES ($1, $2, $3)`,
      [workspaceId, userId, {role: 'admin'}],
  );

  res.status(201).json({message: 'Workspace created successfully'});
}

// GET /api/v0/workspaces works check
/**
 * Gets all workspaces for a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function getWorkspaces(req, res) {
  const userId = req.user.id;


  const query = `
    SELECT 
    w.id,
    w.data->>'name' as name,
    wu.data->>'role' as role
    FROM workspaces w
    JOIN workspace_users wu ON w.id = wu.workspace_id
    WHERE wu.user_id = $1
  `;
  const result = await pool.query(query, [userId]);

  res.status(200).json(result.rows);
}

// PUT /api/v0/workspaces/current

/**
 * Sets the current workspace for a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function setCurrentWorkspace(req, res) {
  const {workspaceId} = req.body;
  const userId = req.user.id;

  await pool.query(
      `UPDATE users SET data =
       jsonb_set(data, '{currentWorkspace}', to_jsonb($1::text)) WHERE id = $2`,
      [workspaceId, userId],
  );

  res.status(200).json({message: 'Current workspace updated successfully'});
}

// GET /api/v0/workspaces/current
/**
 * Gets the current workspace for a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function getCurrentWorkspace(req, res) {
  const userId = req.user.id;

  const result = await pool.query(
      //   `SELECT data->>'currentWorkspace' AS currentWorkspace
      //    FROM users WHERE id = $1`,
      //   [userId],
      `SELECT data->>'currentWorkspace' AS "currentWorkspace"
       FROM users WHERE id = $1`,
      [userId],
  );
  if (!result.rows.length || !result.rows[0].currentWorkspace) {
    return res.status(404).json({message: 'No current workspace found'});
  }
  const currentWorkspace = result.rows[0].currentWorkspace;

  res.status(200).json({currentWorkspace});
}


// GET /api/v0/workspaces/:id/channels
/**
 * Gets all channels for a workspace
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function getChannels(req, res) {
  const {id} = req.params;

  const result = await pool.query(
      `SELECT id, data->>'name' as name
       FROM channels WHERE workspace_id = $1`,
      [id],
  );
  res.status(200).json(result.rows);
}

// POST /api/v0/workspaces/users
/**
 * Adds a user to a workspace
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 - Sends JSON response with success message or error
 */
export async function createChannel(req, res) {
  const {id} = req.params; // workspace id
  const {name} = req.body; // channel name

  await pool.query(
      'INSERT INTO channels (workspace_id, data) VALUES ($1, $2) RETURNING id',
      [id, {name}],
  );

  res.status(201).json({message: 'Channel created successfully'});
}

// GET /api/v0/workspaces/:id/users
/**
 * Gets all users for a workspace
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with success message or error
 */
export async function getUsers(req, res) {
  const {id} = req.params; // workspace id

  const result = await pool.query(
      `SELECT u.id, u.data->>'name' as name,
       (u.data->'online')::boolean as online
       FROM workspace_users wu
       JOIN users u ON wu.user_id = u.id
       WHERE wu.workspace_id = $1`,
      [id],
  );

  res.status(200).json(result.rows);
}

//   await pool.query(
//       'INSERT INTO workspace_users (workspace_id, user_id) VALUES ($1, $2)',
//       [workspaceId, userId],
//   );

//   res.status(201).json({message: 'User added to workspace successfully'});
// }

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
// }

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
// }

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
// }

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
//     senderId: userId,
//     createdAt: new Date().toISOString(),
//   };

//   await pool.query(
//       'INSERT INTO messages (channel_id, data) VALUES ($1, $2)',
//       [channelId, messageData],
//   );

//   res.status(201).json({message: 'Message created successfully'});
// }

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
// }

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
