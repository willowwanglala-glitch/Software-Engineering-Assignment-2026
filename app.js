// app.js
let cloudConfig = { envId: '' };
try {
  cloudConfig = require('./config/cloud.js');
} catch (e) {
  /* 使用 cloud.example.js 复制为 cloud.js */
}

App({
  onLaunch() {
    const envId = (cloudConfig && cloudConfig.envId) || '';
    this.globalData = {
      env: envId,
      user: null
    };

    if (wx.cloud && envId) {
      wx.cloud.init({ env: envId, traceUser: true });
      this.trySeedUniversities();
    }

    const storage = require('./utils/storage.js');
    let cached = storage.getUser();
    // 开发者工具内：无登录态时注入演示用户，便于直接预览首页等功能
    if (!cached && wx.getSystemInfoSync().platform === 'devtools') {
      cached = {
        _id: 'local_dev',
        nickName: '演示同学',
        avatarUrl: '',
        directionId: 'en_lit',
        direction: '英语语言文学',
        universityId: 'u13',
        targetSchool: '中山大学',
        level: 3,
        dailyHours: 2,
        isLocal: true
      };
      storage.setUser(cached);
    }
    if (cached) this.globalData.user = cached;
  },

  trySeedUniversities() {
    const flag = wx.getStorageSync('lfl_seed_done');
    if (flag) return;
    const { api } = require('./utils/api.js');
    api('seedUniversities')
      .then(() => wx.setStorageSync('lfl_seed_done', true))
      .catch(() => {});
  },

  globalData: {
    env: '',
    user: null
  }
});
