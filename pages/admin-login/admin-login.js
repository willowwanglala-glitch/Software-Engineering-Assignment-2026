const { api } = require('../../utils/api.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  async onLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中...' });
    try {
      const res = await api('adminLogin', { username, password });
      storage.setAdminToken(res.token);
      wx.setStorageSync('adminLoggedIn', true);
      wx.navigateTo({ url: '/pages/admin-dashboard/admin-dashboard' });
    } catch (e) {
      wx.showToast({ title: e.message || '登录失败', icon: 'none', duration: 2000 });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
