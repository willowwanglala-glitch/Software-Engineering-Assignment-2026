const { api } = require('../../utils/api.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    activeTab: 'users',
    overview: {
      users: 0,
      active: 0,
      study: 0,
      ai: 0
    },
    userRankList: [],
    schoolList: [],
    trendData: []
  },

  onShow() {
    const loggedIn = wx.getStorageSync('adminLoggedIn') || storage.getAdminToken();
    if (!loggedIn) {
      wx.redirectTo({ url: '/pages/admin-login/admin-login' });
      return;
    }
    this.loadStats();
  },

  async loadStats() {
    wx.showLoading({ title: '加载数据...' });
    try {
      const res = await api('getAdminStats');
      this.setData({
        overview: res.overview || this.data.overview,
        userRankList: res.userRankList || [],
        schoolList: res.schoolList || [],
        trendData: res.trendData || []
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
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
