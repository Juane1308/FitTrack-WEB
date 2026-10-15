const { createAuthService } = require('../services/authService');
const { AuthStatus } = require('../utils/authStatus');
const { HttpError } = require('../utils/httpError');
const { validateLogin, validateRegister } = require('../utils/validators');

const HTTP_BY_STATUS = {
  [AuthStatus.success]: 200,
  [AuthStatus.emailAlreadyRegistered]: 409,
  [AuthStatus.invalidCredentials]: 401,
  [AuthStatus.inactiveAccount]: 403,
};

function createAuthController(authService = createAuthService()) {
  async function register(req, res) {
    const error = validateRegister(req.body ?? {});
    if (error) throw new HttpError(400, error);

    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    const code = result.status === AuthStatus.success ? 201 : HTTP_BY_STATUS[result.status];
    res.status(code).json(result);
  }

  async function login(req, res) {
    const error = validateLogin(req.body ?? {});
    if (error) throw new HttpError(400, error);

    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(HTTP_BY_STATUS[result.status]).json(result);
  }

  async function requestPasswordReset(req, res) {
    await authService.requestPasswordReset(req.body?.email ?? '');
    res.status(202).json({ status: 'accepted' });
  }

  return { register, login, requestPasswordReset };
}

module.exports = { createAuthController };
