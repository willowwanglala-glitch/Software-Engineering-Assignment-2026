let local = {};
try {
  local = require('../config/app.config.local.js');
} catch (e) {
  /* 默认开发模式 */
}

function isProduction() {
  return !!local.production;
}

function showDemoLogin() {
  if (isProduction()) return false;
  return local.showDemoLogin !== false;
}

function showAdminEntry() {
  if (local.showAdminEntry === false) return false;
  if (local.showAdminEntry === true) return true;
  if (isProduction()) return false;
  return true;
}

module.exports = { isProduction, showDemoLogin, showAdminEntry };
