const catalog = require('../../utils/catalog.js');

Page({
  data: {
    selected: -1,
    directions: catalog.listDirections()
  },

  onSelect(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ selected: index });
  },

  onConfirm() {
    if (this.data.selected < 0) {
      wx.showToast({ title: '请选择考研方向', icon: 'none' });
      return;
    }
    const item = this.data.directions[this.data.selected];
    wx.setStorageSync('pendingDirectionId', item.directionId);
    wx.setStorageSync('pendingDirectionName', item.directionName);
    wx.navigateTo({
      url: '/pages/school-list/school-list?directionId=' + item.directionId
    });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/login/login' }) });
  }
});
