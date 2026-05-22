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

  onLogin() {
    const { username, password } = this.data;
    if (username === 'admin' && password === '123456') {
      wx.setStorageSync('adminLoggedIn', true);
      wx.navigateTo({
        url: '/pages/admin-dashboard/admin-dashboard'
      });
    } else {
      wx.showToast({
        title: '账号或密码错误',
        icon: 'none',
        duration: 2000
      });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
