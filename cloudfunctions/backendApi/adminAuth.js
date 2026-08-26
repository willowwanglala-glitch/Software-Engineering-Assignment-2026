let adminLocal = {};
try {
  adminLocal = require('./admin.config.local.js');
} catch (e) {
  /* 云函数目录下复制 admin.config.example.js */
}

const ADMIN_USER = process.env.ADMIN_USER || adminLocal.username || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || adminLocal.password || '123456';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const SECRET = process.env.ADMIN_SECRET || adminLocal.secret || 'lfl_admin_demo_secret';

/** 与小程序端 utils/adminAuth.js 保持同一算法，否则登录后看板会立刻判 token 无效并踢回 */
function signPayload(ts) {
  let hash = 0;
  const s = SECRET + String(ts);
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 16);
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
