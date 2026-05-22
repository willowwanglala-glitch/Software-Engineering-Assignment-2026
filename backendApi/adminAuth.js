const crypto = require('crypto');

const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const SECRET = process.env.ADMIN_SECRET || 'lfl_admin_demo_secret';

function signPayload(ts) {
  return crypto.createHmac('sha256', SECRET).update(String(ts)).digest('hex').slice(0, 16);
}

function createAdminToken() {
  const ts = Date.now();
  return `adm.${ts}.${signPayload(ts)}`;
}

function validateAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'adm') return false;
  const ts = parseInt(parts[1], 10);
  if (!ts || Date.now() - ts > TOKEN_TTL_MS) return false;
  return parts[2] === signPayload(ts);
}

function checkAdminCredentials(username, password) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

module.exports = {
  ADMIN_USER,
  ADMIN_PASS,
  createAdminToken,
  validateAdminToken,
  checkAdminCredentials
};
