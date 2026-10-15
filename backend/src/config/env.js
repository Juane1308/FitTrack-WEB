const path = require('node:path');

try {
  process.loadEnvFile(path.join(__dirname, '..', '..', '.env'));
} catch {
  // Sin archivo .env: se usan las variables del entorno (por ejemplo, en Railway).
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
