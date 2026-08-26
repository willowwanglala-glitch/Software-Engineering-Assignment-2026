const { api } = require('../../utils/api.js');
const { getLocalUser, setLocalUser } = require('../../utils/auth.js');

Page({
  data: {
    universityId: '',
    name: '',
    city: '',
    tags: [],
    feature: '',
    description: '',
    books: [],
    featureDetail: '',
    enrollment: null,
    enrollmentYear: '近年',
    enrollmentNote: '',
    examSubjects: []
  },

  async onLoad(options) {
    const universityId = options.id || '';
    const name = decodeURIComponent(options.name || '');
    this.setData({ universityId, name });
    if (!universityId) return;
    wx.showLoading({ title: '加载中' });
    try {
      const res = await api('getUniversityDetail', { universityId });
      const u = res.university || {};
      wx.hideLoading();
      this.setData({
        name: u.name || name,
        city: u.region || '',
        tags: u.tags || u.types || [],
        feature: (u.tags && u.tags[0]) || '',
        description: u.desc || '',
        books: (u.books || []).map((b) =>
          typeof b === 'string' ? { name: b, author: '' } : { name: b.name || '', author: b.author || '' }
        ),
        featureDetail: u.desc || '',
        enrollment: u.enrollment || null,
        enrollmentYear:
          (u.enrollment && u.enrollment.year) || '近年',
        enrollmentNote:
          u.sourceNote ||
          '一般为近年公开目录估算（多为使用前一年可核验数据），以院校最新招生简章为准',
        examSubjects: u.examSubjects || []
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  async onSelect() {
    const directionId =
      wx.getStorageSync('pendingDirectionId') || getLocalUser()?.directionId || '';
    if (!this.data.universityId || !directionId) {
      wx.showToast({ title: '请先选择方向', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中' });
    try {
      const res = await api('updateProfile', {
        directionId,
        universityId: this.data.universityId
      });
      setLocalUser({ ...(getLocalUser() || {}), ...(res.user || {}) });
      wx.hideLoading();
      wx.showToast({ title: '已选择该院校', icon: 'success' });
      setTimeout(() => wx.reLaunch({ url: '/pages/home/home' }), 800);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
