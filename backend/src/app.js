const cors = require('cors');
const express = require('express');

const { corsOrigin } = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { createApiRoutes } = require('./routes');

function createApp(options = {}) {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use('/api', createApiRoutes(options));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
