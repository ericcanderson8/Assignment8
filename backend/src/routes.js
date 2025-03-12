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

/**
 * Get messages for a specific channel
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with channel messages
 */
export async function getChannelMessages(req, res) {
  const channelId = req.params.channelId;

  try {
    // Verify that the channel exists
    const channelResult = await pool.query(
        'SELECT * FROM channels WHERE id = $1',
        [channelId],
    );

    if (channelResult.rows.length === 0) {
      return res.status(404).json({error: 'Channel not found'});
    }

    // Get messages for the channel
    const result = await pool.query(
        `SELECT m.id, m.user_id, m.data, u.data->>'name' as sender_name
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.channel_id = $1
         ORDER BY m.data->>'timestamp' ASC`,
        [channelId],
    );

    // Format the messages for the client
    const messages = result.rows.map((row) => ({
      id: row.id,
      content: row.data.message,
      sender: row.sender_name,
      timestamp: row.data.timestamp,
      userId: row.user_id,
    }));

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({error: 'Failed to fetch channel messages'});
  }
}

/**
 * Get direct messages between two users
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with DM messages
 */
export async function getDMMessages(req, res) {
  const userId = req.user.id;
  const otherUserId = req.params.userId;

  try {
    // Check if the other user exists
    const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [otherUserId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    // Get messages between the two users
    const result = await pool.query(
        `SELECT d.id, d.sender_id, d.receiver_id, d.data, 
                u1.data->>'name' as sender_name, 
                u2.data->>'name' as receiver_name
         FROM dms d
         JOIN users u1 ON d.sender_id = u1.id
         JOIN users u2 ON d.receiver_id = u2.id
         WHERE (d.sender_id = $1 AND d.receiver_id = $2)
            OR (d.sender_id = $2 AND d.receiver_id = $1)
         ORDER BY d.data->>'timestamp' ASC`,
        [userId, otherUserId],
    );

    // Format the messages for the client
    const messages = result.rows.map((row) => {
      const isFromCurrentUser = row.sender_id === userId;
      return {
        id: row.id,
        content: row.data.content,
        sender: isFromCurrentUser ? 'You' : row.sender_name,
        timestamp: row.data.timestamp,
        userId: row.sender_id,
      };
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    res.status(500).json({error: 'Failed to fetch DM messages'});
  }
}

/**
 * Send a message to a specific channel
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with the created message
 */
export async function sendChannelMessage(req, res) {
  const userId = req.user.id;
  const channelId = req.params.channelId;
  const {content} = req.body;

  try {
    // Verify that the channel exists
    const channelResult = await pool.query(
        'SELECT * FROM channels WHERE id = $1',
        [channelId],
    );

    if (channelResult.rows.length === 0) {
      return res.status(404).json({error: 'Channel not found'});
    }

    // Create message data
    const messageData = {
      message: content,
      timestamp: new Date().toISOString(),
    };

    // Insert the message
    const result = await pool.query(
        `INSERT INTO messages (channel_id, user_id, data)
         VALUES ($1, $2, $3) RETURNING id`,
        [channelId, userId, messageData],
    );

    // Get user info for response
    const userResult = await pool.query(
        'SELECT data->>"name" as name FROM users WHERE id = $1',
        [userId],
    );

    const messageId = result.rows[0].id;
    const senderName = userResult.rows[0].name;

    // Return the created message
    res.status(201).json({
      id: messageId,
      content: messageData.message,
      sender: senderName,
      timestamp: messageData.timestamp,
      userId: userId,
    });
  } catch (error) {
    console.error('Error sending channel message:', error);
    res.status(500).json({error: 'Failed to send message to channel'});
  }
}

/**
 * Send a direct message to another user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>} - Sends JSON response with the created message
 */
export async function sendDMMessage(req, res) {
  const senderId = req.user.id;
  const receiverId = req.params.userId;
  const {content} = req.body;

  try {
    // Check if the receiver user exists
    const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [receiverId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    // Create message data
    const messageData = {
      content: content,
      timestamp: new Date().toISOString(),
    };

    // Insert the direct message
    const result = await pool.query(
        `INSERT INTO dms (sender_id, receiver_id, data)
         VALUES ($1, $2, $3) RETURNING id`,
        [senderId, receiverId, messageData],
    );

    // Get user info for response
    const senderResult = await pool.query(
        'SELECT data->>"name" as name FROM users WHERE id = $1',
        [senderId],
    );

    const messageId = result.rows[0].id;
    const senderName = senderResult.rows[0].name;

    // Return the created message
    res.status(201).json({
      id: messageId,
      content: messageData.content,
      sender: senderName,
      timestamp: messageData.timestamp,
      userId: senderId,
    });
  } catch (error) {
    console.error('Error sending DM message:', error);
    res.status(500).json({error: 'Failed to send direct message'});
  }
}
