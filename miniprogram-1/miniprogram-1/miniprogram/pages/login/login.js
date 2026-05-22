const { loginWithProfile } = require('../../utils/auth.js');
const { useCloud } = require('../../utils/api.js');
const { needOnboarding } = require('../../utils/auth.js');

Page({
  data: {
    modeText: '检测中…'
  },

  onShow() {
    this.setData({
      modeText: useCloud() ? '云开发模式' : '本地存储模式（Alpha 降级）'
    });
    const user = require('../../utils/auth.js').getLocalUser();
    if (user) {
      if (needOnboarding(user)) {
        wx.redirectTo({ url: '/pages/onboarding/onboarding' });
      } else {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    }
  },

  async afterLogin(user) {
    if (needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/onboarding/onboarding' });
    } else {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  onLogin() {
    wx.getUserProfile({
      desc: '用于展示学习档案',
      success: async (res) => {
        wx.showLoading({ title: '登录中' });
        try {
          const user = await loginWithProfile(res.userInfo);
          wx.hideLoading();
          await this.afterLogin(user);
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: e.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '需要授权才能登录', icon: 'none' });
      }
    });
  },

  async onLocalLogin() {
    wx.showLoading({ title: '登录中' });
    try {
      const user = await loginWithProfile({
        nickName: '体验用户',
        avatarUrl: ''
      });
      wx.hideLoading();
      await this.afterLogin(user);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '登录失败', icon: 'none' });
    }
  }
});
