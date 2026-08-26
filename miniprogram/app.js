// app.js
let cloudConfig = { envId: '', useDefaultEnv: false, fallbackToLocal: true };
try {
  cloudConfig = { ...cloudConfig, ...require('./config/cloud.js') };
} catch (e) {
  /* 使用 cloud.example.js 复制为 cloud.js */
}

const { isProduction } = require('./utils/appConfig.js');
const { hasAgreedPrivacy } = require('./utils/compliance.js');

const CLOUD_UNAVAILABLE_KEY = 'lfl_cloud_unavailable';

App({
  onLaunch() {
    const envId = (cloudConfig && cloudConfig.envId) || '';
    const useDefaultEnv = !!(cloudConfig && cloudConfig.useDefaultEnv);
    // 开发/演示：不永久锁死云；避免上次失败后即使重新部署仍走本地降级
    if (!isProduction()) {
      try {
        wx.removeStorageSync(CLOUD_UNAVAILABLE_KEY);
      } catch (e) {
        /* ignore */
      }
    }
    const cloudKnownBad = isProduction() && !!wx.getStorageSync(CLOUD_UNAVAILABLE_KEY);
    let cloudReady = !!(wx.cloud && !cloudKnownBad && (useDefaultEnv || envId));

    this.globalData = {
      env: envId,
      cloudReady,
      cloudFallback: cloudKnownBad,
      user: null,
      production: isProduction()
    };

    if (cloudReady || (wx.cloud && (useDefaultEnv || envId))) {
      try {
        const { ensureCloudInit } = require('./utils/ensureCloud.js');
        const ok = ensureCloudInit();
        this.globalData.cloudReady = !!ok;
        if (ok) this.trySeedContent();
      } catch (e) {
        console.warn('[cloud] init', e);
        if (useDefaultEnv) {
          wx.cloud.init({ traceUser: true });
        } else if (envId) {
          wx.cloud.init({ env: envId, traceUser: true });
        }
        this.globalData.cloudReady = true;
        this.trySeedContent();
      }
    }

    const storage = require('./utils/storage.js');
    let cached = storage.getUser();
    // 仅开发模式 + 开发者工具：自动注入演示用户
    if (
      !isProduction() &&
      !cached &&
      wx.getSystemInfoSync().platform === 'devtools'
    ) {
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
    if (cached && hasAgreedPrivacy()) this.globalData.user = cached;
  },

  trySeedContent() {
    const flag = wx.getStorageSync('lfl_seed_done');
    if (flag) return;
    const { api, useCloud } = require('./utils/api.js');
    // 仅云模式才标记完成；本地降级不算灌库成功，避免云库一直为空
    if (!useCloud()) return;
    api('seedContentData')
      .then((res) => {
        if (res && res.success !== false && !this.globalData.cloudFallback) {
          wx.setStorageSync('lfl_seed_done', true);
        }
      })
      .catch(() => {});
  },

  globalData: {
    env: '',
    cloudReady: false,
    cloudFallback: false,
    user: null
  }
});
