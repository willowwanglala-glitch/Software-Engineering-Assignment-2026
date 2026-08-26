const { loginWithProfile, wechatLogin, getLocalUser, needOnboarding } = require('../../utils/auth.js');
const { useCloud } = require('../../utils/api.js');
const { hasAgreedPrivacy, setAgreedPrivacy } = require('../../utils/compliance.js');
const { showDemoLogin, isProduction } = require('../../utils/appConfig.js');
const { getCloudConfig, isCloudFallback } = require('../../utils/cloudConfig.js');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    isRegister: false,
    modeText: '',
    agreed: false,
    showDemo: true,
    showDemoPanel: false
  },

  onLoad() {
    this.setData({
      showDemo: showDemoLogin(),
      agreed: hasAgreedPrivacy()
    });
  },

  onShow() {
    let modeText;
    if (useCloud()) {
      modeText = '云开发模式（推荐上线）';
    } else if (isCloudFallback()) {
      modeText = '本地模式（云环境暂不可用，已自动降级）';
    } else if (isProduction() && getCloudConfig().fallbackToLocal) {
      modeText = '本地模式（云失败时自动降级，答辩可用）';
    } else if (isProduction()) {
      modeText = '请配置 cloud.js 后使用';
    } else {
      modeText = '本地存储模式（仅演示）';
    }
    this.setData({ modeText });

    const user = getLocalUser();
    if (user && hasAgreedPrivacy() && !needOnboarding(user)) {
      wx.reLaunch({ url: '/pages/home/home' });
    } else if (user && hasAgreedPrivacy() && needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/school-select/school-select' });
    }
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  confirmAgree() {
    setAgreedPrivacy();
    this.setData({ agreed: true });
  },

  openPrivacy() {
    wx.navigateTo({ url: '/pages/legal/privacy' });
  },

  openAgreement() {
    wx.navigateTo({ url: '/pages/legal/agreement' });
  },

  ensureAgreed() {
    if (!this.data.agreed) {
      wx.showModal({
        title: '请先阅读并同意',
        content: '使用本服务需同意《用户协议》和《隐私政策》',
        confirmText: '同意并继续',
        success: (res) => {
          if (res.confirm) {
            setAgreedPrivacy();
            this.setData({ agreed: true });
          }
        }
      });
      return false;
    }
    setAgreedPrivacy();
    return true;
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

  toggleDemoPanel() {
    this.setData({ showDemoPanel: !this.data.showDemoPanel });
  },

  async onWechatLogin() {
    if (!this.ensureAgreed()) return;
    const cfg = getCloudConfig();
    if (isProduction() && !useCloud() && !cfg.fallbackToLocal && !isCloudFallback()) {
      wx.showModal({
        title: '未配置云服务',
        content: '正式上线请在 miniprogram/config/cloud.js 填写 envId 并部署云函数。',
        showCancel: false
      });
      return;
    }
    wx.showLoading({ title: '登录中' });
    try {
      const user = await wechatLogin();
      wx.hideLoading();
      this.afterLogin(user);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '登录失败', icon: 'none' });
    }
  },

  async onLocalExperience() {
    if (!this.ensureAgreed()) return;
    wx.showLoading({ title: '进入中' });
    try {
      const user = await loginWithProfile({
        nickName: this.data.username.trim() || '体验用户',
        avatarUrl: ''
      });
      wx.hideLoading();
      this.afterLogin(user);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '进入失败', icon: 'none' });
    }
  },

  afterLogin(user) {
    if (needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/school-select/school-select' });
    } else {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  onSubmit() {
    if (!this.ensureAgreed()) return;
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
