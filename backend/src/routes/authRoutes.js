const { Router } = require('express');

const { createAuthController } = require('../controllers/authController');

function createAuthRoutes(controller = createAuthController()) {
  const router = Router();
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/forgot-password', controller.requestPasswordReset);
  return router;
}

module.exports = { createAuthRoutes };
