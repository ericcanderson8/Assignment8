-- Your DDL statements go here;
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB NOT NULL
    -- {email: string, password: string, name: string, currentWorkspaceId: string, currentChannelId: string}
);

DROP TABLE IF EXISTS workspaces;
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id),
    data JSONB NOT NULL
    -- {name: string} workspace name
);

DROP TABLE IF EXISTS channels;
CREATE TABLE IF NOT EXISTS channels (
    id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    data JSONB NOT NULL
    -- {name: string} channel name
);

DROP TABLE IF EXISTS messages;
CREATE TABLE IF NOT EXISTS messages (
    id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id),
    user_id UUID NOT NULL REFERENCES users(id),
    data JSONB NOT NULL
    -- stores the message and time
    -- {message: string, timestamp: string}
);

CREATE TABLE IF NOT EXISTS dms (
    id UUID UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    data JSONB NOT NULL
);

DROP TABLE IF EXISTS workspace_users;
CREATE TABLE IF NOT EXISTS workspace_users (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    data JSONB NOT NULL DEFAULT '{}', -- Stores role and other metadata
    PRIMARY KEY (workspace_id, user_id)
    -- {role: string, current: boolean} role of the user in the workspace
    -- current is true if the user is currently in the workspace
);




-- Add constraint to ensure required fields exist in JSONB
ALTER TABLE users ADD CONSTRAINT users_data_check 
CHECK (
    data ? 'email' AND 
    data ? 'password' AND 
    data ? 'name' AND 
    (data->>'email') IS NOT NULL AND 
    (data->>'password') IS NOT NULL AND 
    (data->>'name') IS NOT NULL
);

-- Add unique constraint on email within JSONB
CREATE UNIQUE INDEX users_email_idx ON users ((data->>'email'));
CREATE INDEX idx_workspace_users_user_id ON workspace_users(user_id);




-- Add index on JSONB data for better query performance
CREATE INDEX users_data_gin_idx ON users USING gin (data);