let config = { envId: '', useDefaultEnv: false, fallbackToLocal: true };
try {
  config = { ...config, ...require('../config/cloud.js') };
} catch (e) {
  /* 无 cloud.js */
}

function isCloudUnavailableError(err) {
  const msg = (err && (err.message || err.errMsg)) || '';
  return (
    msg.indexOf('-501000') !== -1 ||
    msg.indexOf('env not exists') !== -1 ||
    msg.indexOf('Environment not found') !== -1 ||
    /function not found|FUNCTION_NOT_FOUND|FUNCTIONS_EXECUTE_FAIL/i.test(msg) ||
    /timed out after|Invoking task timed out|云函数请求超时/i.test(msg)
  );
}

function markCloudFallback(reason) {
  const app = getApp();
  if (!app || !app.globalData) return;
  app.globalData.cloudReady = false;
  app.globalData.cloudFallback = true;
  try {
    wx.setStorageSync('lfl_cloud_unavailable', 1);
  } catch (e) {
    /* ignore */
  }
  if (reason) console.warn('[cloud] 已降级本地模式:', reason);
}

function isCloudFallback() {
  const app = getApp();
  return !!(app && app.globalData && app.globalData.cloudFallback);
}

module.exports = {
  getCloudConfig: () => config,
  isCloudUnavailableError,
  markCloudFallback,
  isCloudFallback
};
