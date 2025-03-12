-- Your data insert statements go here;
-- Insert sample users
-- Password for all users is 'password123' hashed with PBKDF2
-- change it so that users stores current workspace and current channel
INSERT INTO users (data) VALUES (
  '{
    "email": "admin@example.com",
    "password": "76197d33dd4c8dcc70eca5feda52a771:46300ec5cf4d0bde32f42ffa5dee2f648a06f31606e965c755a6b941418fc3e984a8da2614d000527f5dccac04f58ffbbc544f36c25472cd5cec9ffeea9ef0b5",
    "name": "Admin User",
    "role": "admin",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "currentWorkspace": null,
    "currentChannel": null,
    "online": false
  }'
);

INSERT INTO users (data) VALUES (
  '{
    "email": "user@example.com",
    "password": "7afb87713e9c5b9bf71fcb95dde909c4:d4635315f1280fa6d17b63b5dc9fa2f7fc5f74ec448946a49c10a44954a971080afbae44b5d67c90001e4dd682a8936a47badc0d60b285e528031bb34c934be0",
    "name": "Regular User",
    "role": "user",
    "createdAt": "2023-01-02T00:00:00.000Z",
    "currentWorkspace": null,
    "currentChannel": null,
    "online": false
  }'
);

-- password is "mollymember"
INSERT INTO users (data) VALUES (
  '{
    "email": "molly@books.com",
    "password": "2731a0d6e0b020705ca2b92b309a4956:37edfeff7baaf25456b253a09ff8beb01e7d85aea1c6ab83c2b2ba46e0ed079333c6c88a27b187f25ed65ea87a1e7081c2206fcd2e7242cc2fc9ba369c616218",
    "name": "Molly Books",
    "role": "user",
    "createdAt": "2023-01-03T00:00:00.000Z",
    "currentWorkspace": null,
    "currentChannel": null,
    "online": false
  }'
);

-- password is "annaadmin"
INSERT INTO users (data) VALUES (
  '{
    "email": "anna@books.com",
    "password": "dfb23c4b25f480291bf5515df6c33cc0:bd312519ca1d4c9fc67e77404cbfc30fbfee3e2c94b1ef5cfea71fd2084185f7f3a49351c13e51290dc599558f8a6224dcf0f838f7c49e116660639e1b541f99",
    "name": "Anna",
    "role": "admin",
    "createdAt": "2023-01-03T00:00:00.000Z",
    "currentWorkspace": null,
    "currentChannel": null,
    "online": false
  }'
);

-- Retrieve Anna Books' ID
WITH anna AS (
    SELECT id FROM users WHERE data->>'email' = 'anna@books.com'
)
-- Insert the workspace with Anna as the creator
INSERT INTO workspaces (creator_id, data)
SELECT id, '{"name": "CSE 186"}'::jsonb FROM anna
RETURNING id;

-- Retrieve the workspace ID
WITH workspace AS (
    SELECT id FROM workspaces WHERE data->>'name' = 'CSE 186'
),
users_list AS (
    SELECT id, data->>'email' as email FROM users
)
-- Add all users to the workspace with appropriate roles
INSERT INTO workspace_users (workspace_id, user_id, data)
SELECT 
    workspace.id, 
    users_list.id,
    CASE 
        WHEN users_list.email = 'anna@books.com' THEN '{"role": "admin", "current": true}'::jsonb
        ELSE '{"role": "member", "current": true}'::jsonb
    END
FROM workspace, users_list;

-- Add CSE 101 workspace and store its ID
WITH anna AS (
    SELECT id FROM users WHERE data->>'email' = 'anna@books.com'
),
new_workspace AS (
    -- Insert the workspace with Anna as the creator and RETURN its ID
    INSERT INTO workspaces (creator_id, data)
    SELECT id, '{"name": "CSE 101"}'::jsonb FROM anna
    RETURNING id
),
users_list AS (
    SELECT id, data->>'email' as email FROM users
)
-- Add all users to the workspace with appropriate roles
INSERT INTO workspace_users (workspace_id, user_id, data)
SELECT 
    new_workspace.id, 
    users_list.id,
    CASE 
        WHEN users_list.email = 'anna@books.com' THEN '{"role": "admin"}'::jsonb
        ELSE '{"role": "member"}'::jsonb
    END
FROM new_workspace, users_list;

-- Add channels to CSE 101 workspace in the same transaction
INSERT INTO channels (workspace_id, data)
SELECT id, '{"name": "General"}'::jsonb 
FROM workspaces 
WHERE data->>'name' = 'CSE 101';

INSERT INTO channels (workspace_id, data)
SELECT id, '{"name": "Announcements"}'::jsonb 
FROM workspaces 
WHERE data->>'name' = 'CSE 101';

INSERT INTO channels (workspace_id, data)
SELECT id, '{"name": "Assignments"}'::jsonb 
FROM workspaces 
WHERE data->>'name' = 'CSE 101';

INSERT INTO channels (workspace_id, data)
SELECT id, '{"name": "Discussions"}'::jsonb 
FROM workspaces 
WHERE data->>'name' = 'CSE 101';

-- Set current workspace and channel for each user using CSE 101's workspace ID
WITH cse101_workspace AS (
    SELECT id as workspace_id FROM workspaces WHERE data->>'name' = 'CSE 101'
),
cse101_channel AS (
    SELECT c.id as channel_id 
    FROM channels c 
    JOIN cse101_workspace w ON c.workspace_id = w.workspace_id 
    WHERE c.data->>'name' = 'General'
)
UPDATE users 
SET data = jsonb_set(
    jsonb_set(
        data, 
        '{currentWorkspace}', 
        (SELECT to_jsonb(workspace_id::text) FROM cse101_workspace)
    ),
    '{currentChannel}',
    (SELECT to_jsonb(channel_id::text) FROM cse101_channel)
);

-- Insert example messages in the General channel
WITH 
general_channel AS (
    SELECT c.id as channel_id 
    FROM channels c 
    JOIN workspaces w ON c.workspace_id = w.id
    WHERE c.data->>'name' = 'General' AND w.data->>'name' = 'CSE 101'
),
users_data AS (
    SELECT id, data->>'name' AS name, data->>'email' AS email
    FROM users
)
-- Insert messages into the General channel
INSERT INTO messages (channel_id, user_id, data)
SELECT 
    gc.channel_id,
    u.id,
    '{"message": "Welcome to the General channel everyone! This will be our main communication channel for the course.", "timestamp": "2023-09-01T09:00:00Z"}'::jsonb
FROM users_data u
JOIN general_channel gc ON TRUE  
WHERE u.email = 'anna@books.com';

WITH 
general_channel AS (
    SELECT c.id as channel_id 
    FROM channels c 
    JOIN workspaces w ON c.workspace_id = w.id
    WHERE c.data->>'name' = 'General' AND w.data->>'name' = 'CSE 101'
),
users_data AS (
    SELECT id, data->>'name' AS name, data->>'email' AS email
    FROM users
)
-- Add another message to General channel from Molly
INSERT INTO messages (channel_id, user_id, data)
SELECT 
    gc.channel_id,
    u.id,
    '{"message": "Thanks for setting this up! Looking forward to the course.", "timestamp": "2023-09-01T09:15:00Z"}'::jsonb
FROM users_data u
JOIN general_channel gc ON TRUE
WHERE u.email = 'molly@books.com';

WITH 
general_channel AS (
    SELECT c.id as channel_id 
    FROM channels c 
    JOIN workspaces w ON c.workspace_id = w.id
    WHERE c.data->>'name' = 'General' AND w.data->>'name' = 'CSE 101'
),
users_data AS (
    SELECT id, data->>'email' AS email
    FROM users
)
INSERT INTO messages (channel_id, user_id, data)
SELECT 
    gc.channel_id,
    u.id,
    '{"message": "Hello everyone! Excited to be part of this class.", "timestamp": "2023-09-01T09:30:00Z"}'::jsonb
FROM users_data u
JOIN general_channel gc ON TRUE
WHERE u.email = 'user@example.com';

-- users_data AS (
--     SELECT id, data->>'name' AS name, data->>'email' AS email
--     FROM users
-- )
-- -- Insert announcement from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "Welcome to CSE 101! The course syllabus has been posted to the course website.", "timestamp": "2023-09-02T10:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN announcements_channel ac ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Add second announcement from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "Office hours will begin next week. The schedule is posted on the course website.", "timestamp": "2023-09-03T11:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN announcements_channel ac ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Add third announcement from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "First quiz will be on Friday. Please review chapters 1-3 in the textbook.", "timestamp": "2023-09-05T08:30:00Z"}'::jsonb
-- FROM users_data u
-- JOIN announcements_channel ac ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Insert messages in the Assignments channel
-- WITH 
-- assignments_channel AS (
--     SELECT c.id as channel_id 
--     FROM channels c 
--     JOIN workspaces w ON c.workspace_id = w.id
--     WHERE c.data->>'name' = 'Assignments' AND w.data->>'name' = 'CSE 101'
-- ),
-- users_data AS (
--     SELECT id, data->>'name' AS name, data->>'email' AS email
--     FROM users
-- )
-- -- Insert assignment info from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "Assignment 1 has been posted. Due date: September 15th. Please submit through the course portal.", "timestamp": "2023-09-04T14:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN assignments_channel ac ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Add question from Regular User
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "Is collaboration allowed on Assignment 1?", "timestamp": "2023-09-04T15:30:00Z"}'::jsonb
-- FROM users_data u
-- JOIN assignments_channel ac ON TRUE
-- WHERE u.email = 'user@example.com';

-- -- Add response from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "You may discuss approaches with classmates, but all code must be written individually.", "timestamp": "2023-09-04T16:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN assignments_channel ac ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Add second assignment from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     ac.channel_id,
--     u.id,
--     '{"message": "Assignment 2 has been posted. Due date: September 29th. This one covers binary trees and graph algorithms.", "timestamp": "2023-09-18T13:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN assignments_channel ac ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Insert messages in the Discussions channel
-- WITH 
-- discussions_channel AS (
--     SELECT c.id as channel_id 
--     FROM channels c 
--     JOIN workspaces w ON c.workspace_id = w.id
--     WHERE c.data->>'name' = 'Discussions' AND w.data->>'name' = 'CSE 101'
-- ),
-- users_data AS (
--     SELECT id, data->>'name' AS name, data->>'email' AS email
--     FROM users
-- )
-- -- Insert discussion starter from Molly
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "Has anyone started working on the binary search implementation for Assignment 1?", "timestamp": "2023-09-05T18:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'molly@books.com';

-- -- Add response from Regular User
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "I just started. Are you using iterative or recursive approach?", "timestamp": "2023-09-05T18:15:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'user@example.com';

-- -- Add follow-up from Molly
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "I'm trying both to see which is more efficient. The recursive solution is more elegant though.", "timestamp": "2023-09-05T18:30:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'molly@books.com';

-- -- Add comment from Anna
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "Good discussion! Remember to analyze the time and space complexity for both approaches in your submission.", "timestamp": "2023-09-05T19:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'anna@books.com';

-- -- Add new discussion topic
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "Does anyone have a good resource for understanding hash table collisions? The textbook explanation is a bit confusing.", "timestamp": "2023-09-07T14:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'user@example.com';

-- -- Add response from Molly
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "I found this YouTube tutorial really helpful: https://www.youtube.com/watch?v=hashexample. It visualizes the collision resolution methods.", "timestamp": "2023-09-07T14:30:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'molly@books.com';

-- -- Add response from Anna with additional resource
-- INSERT INTO messages (channel_id, user_id, data)
-- SELECT 
--     dc.channel_id,
--     u.id,
--     '{"message": "I'll also share some additional notes on hash table implementations in the next lecture. Check the course website for practice problems.", "timestamp": "2023-09-07T15:00:00Z"}'::jsonb
-- FROM users_data u
-- JOIN discussions_channel dc ON TRUE
-- WHERE u.email = 'anna@books.com';

