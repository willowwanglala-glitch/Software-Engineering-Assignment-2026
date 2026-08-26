const { api } = require('../../utils/api.js');
const storage = require('../../utils/storage.js');
const { validateAdminToken } = require('../../utils/adminAuth.js');

Page({
  data: {
    activeTab: 'students',
    overview: {
      users: 0,
      active: 0,
      study: 0,
      ai: 0
    },
    studentList: [],
    userRankList: [],
    schoolList: [],
    trendData: [],
    feedbackList: []
  },

  onShow() {
    const token = storage.getAdminToken();
    // 无 token 才踢回；签名校验交给 getAdminStats（云/本地），避免前后端算法不一致时「登录闪退」
    if (!token) {
      wx.removeStorageSync('adminLoggedIn');
      wx.redirectTo({ url: '/pages/admin-login/admin-login' });
      return;
    }
    if (!validateAdminToken(token)) {
      console.warn('[admin] 本地 token 校验未通过，仍尝试云端拉取统计');
    }
    this.loadStats();
  },

  async loadStats() {
    wx.showLoading({ title: '加载数据...' });
    try {
      const res = await api('getAdminStats');
      this.setData({
        overview: res.overview || this.data.overview,
        studentList: res.studentList || [],
        userRankList: res.userRankList || [],
        schoolList: res.schoolList || [],
        trendData: res.trendData || [],
        feedbackList: res.feedbackList || []
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败，请重新登录', icon: 'none' });
      if ((e.message || '').indexOf('未授权') >= 0) {
        wx.removeStorageSync('adminLoggedIn');
        storage.setAdminToken('');
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/admin-login/admin-login' });
        }, 1200);
      }
    } finally {
      wx.hideLoading();
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  openSchoolUsers(e) {
    const name = e.currentTarget.dataset.name;
    if (!name) return;
    wx.navigateTo({
      url:
        '/pages/admin-school-users/admin-school-users?school=' +
        encodeURIComponent(name)
    });
  },

  goBack() {
    wx.navigateBack();
  },

  logoutAdmin() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理后台吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('adminLoggedIn');
          storage.setAdminToken('');
          wx.navigateBack();
        }
      }
    });
  }
});
