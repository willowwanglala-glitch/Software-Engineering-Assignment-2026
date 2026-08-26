/**
 * 确保已调用 wx.cloud.init（真机调试/热更新后偶发未 init）
 */
const { getCloudConfig } = require('./cloudConfig.js');

let inited = false;

function ensureCloudInit() {
  if (!wx.cloud) return false;
  const cfg = getCloudConfig();
  const envId = (cfg && cfg.envId) || '';
  const useDefaultEnv = !!(cfg && cfg.useDefaultEnv);
  if (!useDefaultEnv && !envId) return false;

  try {
    if (useDefaultEnv) {
      wx.cloud.init({ traceUser: true });
    } else {
      wx.cloud.init({ env: envId, traceUser: true });
    }
    inited = true;
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.cloudReady = true;
      app.globalData.cloudFallback = false;
      app.globalData.env = envId || app.globalData.env;
    }
    return true;
  } catch (e) {
    console.warn('[cloud] init failed', e);
    return false;
  }
}

function isCloudInited() {
  return inited;
}

module.exports = { ensureCloudInit, isCloudInited };
