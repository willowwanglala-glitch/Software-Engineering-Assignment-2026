const { api } = require('../../utils/api.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    schoolName: '',
    users: []
  },

  onLoad(options) {
    const token = storage.getAdminToken();
    if (!token) {
      wx.redirectTo({ url: '/pages/admin-login/admin-login' });
      return;
    }
    const schoolName = decodeURIComponent(options.school || '');
    this.setData({ schoolName });
    this.loadUsers(schoolName);
  },

  async loadUsers(schoolName) {
    wx.showLoading({ title: '加载中' });
    try {
      const res = await api('getAdminStats');
      const list = res.studentList || [];
      const users = list.filter(
        (u) => (u.targetSchool || '') === schoolName
      );
      this.setData({ users });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
