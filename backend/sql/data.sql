-- Your data insert statements go here;
-- Insert sample users
-- Password for all users is 'password123' hashed with PBKDF2
INSERT INTO users (data) VALUES (
  '{
    "email": "admin@example.com",
    "password": "76197d33dd4c8dcc70eca5feda52a771:46300ec5cf4d0bde32f42ffa5dee2f648a06f31606e965c755a6b941418fc3e984a8da2614d000527f5dccac04f58ffbbc544f36c25472cd5cec9ffeea9ef0b5",
    "name": "Admin User",
    "role": "admin",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }'
);

INSERT INTO users (data) VALUES (
  '{
    "email": "user@example.com",
    "password": "7afb87713e9c5b9bf71fcb95dde909c4:d4635315f1280fa6d17b63b5dc9fa2f7fc5f74ec448946a49c10a44954a971080afbae44b5d67c90001e4dd682a8936a47badc0d60b285e528031bb34c934be0",
    "name": "Regular User",
    "role": "user",
    "createdAt": "2023-01-02T00:00:00.000Z"
  }'
);

-- password is "mollymember"
INSERT INTO users (data) VALUES (
  '{
    "email": "molly@books.com",
    "password": "2731a0d6e0b020705ca2b92b309a4956:37edfeff7baaf25456b253a09ff8beb01e7d85aea1c6ab83c2b2ba46e0ed079333c6c88a27b187f25ed65ea87a1e7081c2206fcd2e7242cc2fc9ba369c616218",
    "name": "Molly Books",
    "role": "user",
    "createdAt": "2023-01-03T00:00:00.000Z"
  }'
);

-- password is "annaadmin"
INSERT INTO users (data) VALUES (
  '{
    "email": "anna@books.com",
    "password": "dfb23c4b25f480291bf5515df6c33cc0:bd312519ca1d4c9fc67e77404cbfc30fbfee3e2c94b1ef5cfea71fd2084185f7f3a49351c13e51290dc599558f8a6224dcf0f838f7c49e116660639e1b541f99",
    "name": "Anna",
    "role": "admin",
    "createdAt": "2023-01-03T00:00:00.000Z"
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

-- Add CSE 101 workspace
WITH anna AS (
    SELECT id FROM users WHERE data->>'email' = 'anna@books.com'
)
-- Insert the workspace with Anna as the creator
INSERT INTO workspaces (creator_id, data)
SELECT id, '{"name": "CSE 101"}'::jsonb FROM anna
RETURNING id;

-- Add users to CSE 101 workspace
WITH workspace AS (
    SELECT id FROM workspaces WHERE data->>'name' = 'CSE 101'
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
        WHEN users_list.email = 'anna@books.com' THEN '{"role": "admin", "current": false}'::jsonb
        ELSE '{"role": "member", "current": false}'::jsonb
    END
FROM workspace, users_list;
