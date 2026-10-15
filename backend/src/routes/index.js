const { Router } = require('express');

const { createAuthRoutes } = require('./authRoutes');

function createApiRoutes(options = {}) {
  const router = Router();
  router.get('/health', (_req, res) => res.json({ status: 'ok' }));
  router.use('/auth', createAuthRoutes(options.authController));
  return router;
}

module.exports = { createApiRoutes };
