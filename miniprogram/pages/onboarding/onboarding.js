const { api } = require('../../utils/api.js');
const { getLocalUser, setLocalUser } = require('../../utils/auth.js');

Page({
  data: {
    step: 0,
    directions: [],
    universities: [],
    selectedDirectionId: '',
    selectedUniversityId: '',
    selectedDirectionName: '',
    selectedUniversityName: '',
    detail: null,
    loading: false
  },

  async onLoad() {
    const user = getLocalUser();
    if (user) {
      this.setData({
        selectedDirectionId: user.directionId || '',
        selectedUniversityId: user.universityId || '',
        selectedDirectionName: user.direction || '',
        selectedUniversityName: user.targetSchool || ''
      });
    }
    await this.loadDirections();
  },

  async loadDirections() {
    try {
      const res = await api('listDirections');
      this.setData({ directions: res.list || [] });
    } catch (e) {
      wx.showToast({ title: e.message || '加载方向失败', icon: 'none' });
    }
  },

  async loadUniversities(directionId) {
    wx.showLoading({ title: '加载院校' });
    try {
      const res = await api('listUniversities', { directionId });
      wx.hideLoading();
      this.setData({ universities: res.list || [], step: 1 });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载院校失败', icon: 'none' });
    }
  },

  onSelectDirection(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      selectedDirectionId: id,
      selectedDirectionName: name,
      selectedUniversityId: '',
      selectedUniversityName: '',
      detail: null
    });
  },

  onNextToSchools() {
    if (!this.data.selectedDirectionId) {
      wx.showToast({ title: '请先选择考研方向', icon: 'none' });
      return;
    }
    this.loadUniversities(this.data.selectedDirectionId);
  },

  async onSelectUniversity(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      selectedUniversityId: id,
      selectedUniversityName: name,
      step: 2,
      loading: true
    });
    try {
      const res = await api('getUniversityDetail', { universityId: id });
      this.setData({ detail: res.university, loading: false });
    } catch (err) {
      this.setData({ detail: null, loading: false });
    }
  },

  onBackStep() {
    const step = this.data.step;
    if (step <= 0) {
      wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/home/home' }) });
      return;
    }
    this.setData({ step: step - 1 });
  },

  async onSave() {
    if (!this.data.selectedDirectionId || !this.data.selectedUniversityId) {
      wx.showToast({ title: '请完成方向与院校选择', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中' });
    try {
      const res = await api('updateProfile', {
        directionId: this.data.selectedDirectionId,
        universityId: this.data.selectedUniversityId
      });
      const merged = { ...(getLocalUser() || {}), ...(res.user || {}) };
      setLocalUser(merged);
      wx.hideLoading();
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  }
});
