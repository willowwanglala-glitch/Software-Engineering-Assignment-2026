// 复制为 cloud.js 并填入云开发环境 ID（勿提交 cloud.js 到公开仓库）
module.exports = {
  envId: '', // 例如 cloud1-xxxxxxxx 或 cloudbase-xxxxxxxx
  useDefaultEnv: true, // true=用开发者工具当前云环境
  // 答辩演示: true（云失败时走本地）；正式上线: false
  fallbackToLocal: true
};
