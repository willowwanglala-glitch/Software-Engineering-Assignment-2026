// app.js
App({
  onLaunch() {
    // 开通云开发后填入环境 ID，例如 cloud1-xxxx；留空则使用本地存储降级
    this.globalData = {
      env: '',
      user: null
    };

    if (wx.cloud && this.globalData.env) {
      wx.cloud.init({ env: this.globalData.env, traceUser: true });
    }

    const cached = require('./utils/storage.js').getUser();
    if (cached) this.globalData.user = cached;
  },
  globalData: {
    env: '',
    user: null
  }
});
