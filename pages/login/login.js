const { loginWithProfile, wechatLogin, getLocalUser, needOnboarding } = require('../../utils/auth.js');
const { useCloud } = require('../../utils/api.js');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    isRegister: false,
    modeText: ''
  },

  onShow() {
    this.setData({
      modeText: useCloud() ? '云开发模式' : '本地存储模式'
    });
    const user = getLocalUser();
    if (user && !needOnboarding(user)) {
      wx.reLaunch({ url: '/pages/home/home' });
    } else if (user && needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/school-select/school-select' });
    }
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  switchMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      confirmPassword: ''
    });
  },

  async onWechatLogin() {
    wx.showLoading({ title: '微信登录中' });
    try {
      const user = await wechatLogin();
      wx.hideLoading();
      if (needOnboarding(user)) {
        wx.redirectTo({ url: '/pages/school-select/school-select' });
      } else {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '登录失败', icon: 'none' });
    }
  },

  async onLocalExperience() {
    wx.showLoading({ title: '进入中' });
    try {
      const user = await loginWithProfile({
        nickName: this.data.username.trim() || '体验用户',
        avatarUrl: ''
      });
      wx.hideLoading();
      if (needOnboarding(user)) {
        wx.redirectTo({ url: '/pages/school-select/school-select' });
      } else {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '进入失败', icon: 'none' });
    }
  },

  onSubmit() {
    const { username, password, confirmPassword, isRegister } = this.data;
    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (isRegister) {
      if (password !== confirmPassword) {
        wx.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }
      const users = wx.getStorageSync('demo_users') || [];
      if (users.find((u) => u.username === username)) {
        wx.showToast({ title: '用户名已存在', icon: 'none' });
        return;
      }
      users.push({ username, password });
      wx.setStorageSync('demo_users', users);
    } else {
      const users = wx.getStorageSync('demo_users') || [];
      const user = users.find((u) => u.username === username && u.password === password);
      if (!user) {
        wx.showToast({ title: '用户名或密码错误', icon: 'none' });
        return;
      }
    }
    this.onLocalExperience();
  }
});
