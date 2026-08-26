const { getLocalUser, setLocalUser } = require('../../utils/auth.js');
const { api, useCloud } = require('../../utils/api.js');
const { showAdminEntry } = require('../../utils/appConfig.js');
const { isCloudFallback } = require('../../utils/cloudConfig.js');
const storage = require('../../utils/storage.js');
const { listPresetAvatars, getPresetAvatar } = require('../../utils/presetAvatars.js');

Page({
  data: {
    user: {},
    username: '用户',
    usernameFirst: '用',
    schoolName: '未设置',
    directionName: '未设置',
    modeText: '',
    showAdmin: false,
    avatarUrl: '',
    editNickName: '',
    statDays: 0,
    statMinutesWeek: 0,
    statFocusCount: 0,
    presetVisible: false,
    presetAvatars: listPresetAvatars(),
    selectedPresetId: '',
    aiApplying: false
  },

  noop() {},

  onLoad() {
    this._saving = false;
  },

  onShow() {
    const user = getLocalUser();
    if (!user) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.applyUserToView(user);
    this._showSeq = (this._showSeq || 0) + 1;
    this.refreshProfileQuietly(this._showSeq);
    this.loadStats();
  },

  applyUserToView(user) {
    const nick = (user.nickName || '用户').trim();
    const avatar =
      user.avatarUrl || this.data.avatarUrl || getLocalUser()?.avatarUrl || '';
    this.setData({
      user,
      username: nick,
      editNickName: nick,
      usernameFirst: nick.slice(0, 1) || '用',
      avatarUrl: avatar,
      schoolName: (user.targetSchool || '').trim() || '未设置',
      directionName: (user.direction || '').trim() || '未设置',
      modeText: useCloud() ? '云开发' : isCloudFallback() ? '本地(云已降级)' : '本地存储',
      showAdmin: showAdminEntry()
    });
  },

  async refreshProfileQuietly(seq) {
    if (this._saving) return;
    try {
      const res = await api('getUserProfile');
      if (seq !== this._showSeq || this._saving) return;
      if (!res.user) return;
      const local = getLocalUser() || {};
      const merged = { ...local, ...res.user };
      const keepAvatar =
        this.data.avatarUrl || local.avatarUrl || '';
      if (keepAvatar && (!res.user.avatarUrl || res.user.avatarUrl !== keepAvatar)) {
        merged.avatarUrl = keepAvatar;
      }
      const user = setLocalUser(merged);
      storage.registerUser(user);
      if (seq !== this._showSeq || this._saving) return;
      this.applyUserToView(user);
    } catch (e) {
      console.warn('getUserProfile', e);
    }
  },

  onNickInput(e) {
    this.setData({ editNickName: e.detail.value });
  },

  openPresetAvatar() {
    if (this._saving || this.data.aiApplying) return;
    const current = this.data.avatarUrl || '';
    const hit = (this.data.presetAvatars || []).find((a) => a.src === current);
    this.setData({
      presetVisible: true,
      selectedPresetId: hit ? hit.id : ''
    });
  },

  closePresetAvatar() {
    if (this.data.aiApplying) return;
    this.setData({ presetVisible: false });
  },

  selectPreset(e) {
    const id = e.currentTarget.dataset.id || '';
    if (!id) return;
    this.setData({ selectedPresetId: id });
  },

  async applyPresetAvatar() {
    const preset = getPresetAvatar(this.data.selectedPresetId);
    if (!preset || this.data.aiApplying) return;
    this.setData({ aiApplying: true });
    wx.showLoading({ title: '保存头像...' });
    try {
      const localUser = getLocalUser() || {};
      const nickName = (this.data.editNickName || localUser.nickName || '用户').trim();
      const avatarUrl = preset.src;
      const res = await api('updateProfile', { nickName, avatarUrl });
      const user = setLocalUser({
        ...localUser,
        ...(res.user || {}),
        nickName,
        avatarUrl
      });
      storage.registerUser(user);
      this.applyUserToView(user);
      this.setData({
        presetVisible: false,
        selectedPresetId: preset.id
      });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    } catch (e) {
      wx.showToast({
        title: (e && e.message) || '保存失败',
        icon: 'none'
      });
    } finally {
      this.setData({ aiApplying: false });
      wx.hideLoading();
    }
  },

  async saveNickName() {
    if (this._saving) return;
    const nickName = (this.data.editNickName || '').trim();
    if (!nickName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    this._saving = true;
    wx.showLoading({ title: '保存中' });
    try {
      const res = await api('updateProfile', {
        nickName,
        avatarUrl: this.data.avatarUrl || getLocalUser()?.avatarUrl || ''
      });
      const user = setLocalUser({ ...(getLocalUser() || {}), ...(res.user || {}), nickName });
      storage.registerUser(user);
      this.applyUserToView(user);
      wx.showToast({ title: '昵称已保存', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    } finally {
      this._saving = false;
      wx.hideLoading();
    }
  },

  async loadStats() {
    try {
      const weekRes = await api('getWeeklyStats', { days: 7 });
      const totalMinutes = weekRes.totalMinutes || 0;
      const sessionCount = weekRes.sessionCount || 0;
      const byDate = weekRes.byDate || {};
      this.setData({
        statMinutesWeek: (totalMinutes / 60).toFixed(1),
        statFocusCount: sessionCount,
        statDays: Object.keys(byDate).length
      });
    } catch (e) {
      console.warn('loadStats', e);
    }
  },

  goSchoolSelect() {
    wx.navigateTo({ url: '/pages/school-select/school-select' });
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin-login/admin-login' });
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu;
    if (menu === 'help') {
      wx.navigateTo({ url: '/pages/feedback/feedback' });
      return;
    }
    if (menu === 'settings') {
      wx.navigateTo({ url: '/pages/legal/privacy' });
      return;
    }
    const names = {
      favorite: '我的收藏',
      notification: '消息通知'
    };
    wx.showToast({
      title: (names[menu] || '功能') + ' · 即将开放',
      icon: 'none'
    });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号吗？',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync('lfl_user');
        const { clearAgreedPrivacy } = require('../../utils/compliance.js');
        const app = getApp();
        if (app) app.globalData.user = null;
        clearAgreedPrivacy();
        wx.reLaunch({ url: '/pages/login/login' });
      }
    });
  }
});
