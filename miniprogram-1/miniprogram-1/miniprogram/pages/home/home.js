const { api, useCloud } = require('../../utils/api.js');
const { getLocalUser, needOnboarding } = require('../../utils/auth.js');

Page({
  data: {
    user: {},
    stats: { totalMinutes: 0, sessionCount: 0 },
    modeText: ''
  },

  onShow() {
    const user = getLocalUser();
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    if (needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/onboarding/onboarding' });
      return;
    }
    this.setData({
      user,
      modeText: useCloud() ? '后端：微信云开发' : '后端：本地存储（Alpha）'
    });
    this.loadStats();
  },

  async loadStats() {
    try {
      const stats = await api('getWeeklyStats', { days: 7 });
      this.setData({
        stats: {
          totalMinutes: stats.totalMinutes || 0,
          sessionCount: stats.sessionCount || 0
        }
      });
    } catch (e) {
      console.warn('loadStats', e);
    }
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  }
});
