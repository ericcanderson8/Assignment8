/*
#######################################################################
#
# Copyright (C) 2020-2025 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/
import express from 'express';
import cors from 'cors';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'node:path';
import OpenApiValidator from 'express-openapi-validator';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as auth from './auth.js';
import * as routes from './routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const apiSpec = path.join(__dirname, '../api/openapi.yaml');

const apidoc = yaml.load(fs.readFileSync(apiSpec, 'utf8'));
app.use('/api/v0/docs', swaggerUi.serve, swaggerUi.setup(apidoc));

// Allow connections from a non common origin so the UI can connect
app.use(cors({origin: 'http://localhost:3000'}));

app.use(
    OpenApiValidator.middleware({
      apiSpec: apiSpec,
      validateRequests: true,
      validateResponses: true,
    }),
);

// Authentication routes
app.post('/api/v0/login', auth.login);
app.post('/api/v0/register', auth.register);

// Protected routes - add auth.check middleware
app.post('/api/v0/workspaces', auth.check, routes.createWorkspace);
app.get('/api/v0/workspaces', auth.check, routes.getWorkspaces);
app.put('/api/v0/workspaces/current', auth.check, routes.setCurrentWorkspace);
app.get('/api/v0/workspaces/current', auth.check, routes.getCurrentWorkspace);
// CREATE A ROUTE TO GET ALL CHANNELS FOR A WORKSPACE
app.post('/api/v0/workspaces/:id/channels', auth.check, routes.createChannel);
app.get('/api/v0/workspaces/:id/channels', auth.check, routes.getChannels);
// CREATE A ROUTE TO GET ALL USERS FOR A WORKSPACE
app.get('/api/v0/workspaces/:id/users', auth.check, routes.getUsers);
// Add routes for messages
app.get('/api/v0/channels/:channelId/messages',
    auth.check, routes.getChannelMessages);
app.get('/api/v0/dm/:userId/messages', auth.check, routes.getDMMessages);
// Add routes for sending messages
app.post('/api/v0/channels/:channelId/messages',
    auth.check, routes.sendChannelMessage);
app.post('/api/v0/dm/:userId/messages',
    auth.check, routes.sendDMMessage);

app.use((err, req, res, next) => {
  res.status(err.status).json({
    message: err.message,
    errors: err.errors,
    status: err.status,
  });
});

export default app;
