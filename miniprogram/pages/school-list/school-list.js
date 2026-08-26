const { api } = require('../../utils/api.js');

Page({
  data: {
    directionId: '',
    directionName: '',
    schools: [],
    schoolCount: 0
  },

  async onLoad(options) {
    const directionId = options.directionId || wx.getStorageSync('pendingDirectionId') || '';
    const directionName = decodeURIComponent(options.direction || '') || wx.getStorageSync('pendingDirectionName') || '';
    this.setData({ directionId, directionName });
    wx.showLoading({ title: '加载院校' });
    try {
      const res = await api('listUniversities', { directionId });
      const schools = (res.list || []).map((u) => ({
        _id: u._id,
        name: u.name,
        city: u.region,
        tags: u.types || [],
        feature: (u.tags && u.tags[0]) || u.desc || ''
      }));
      wx.hideLoading();
      this.setData({ schools, schoolCount: schools.length });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  goDetail(e) {
    const index = e.currentTarget.dataset.index;
    const school = this.data.schools[index];
    if (!school) return;
    wx.navigateTo({
      url:
        '/pages/school-detail/school-detail?id=' +
        school._id +
        '&name=' +
        encodeURIComponent(school.name)
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
