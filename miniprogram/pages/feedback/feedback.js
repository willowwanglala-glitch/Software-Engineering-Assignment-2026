const { api } = require('../../utils/api.js');

Page({
  data: {
    types: ['功能问题', 'AI 内容投诉', '隐私相关', '其他'],
    typeIndex: 0,
    content: '',
    contact: ''
  },

  onTypeChange(e) {
    this.setData({ typeIndex: parseInt(e.detail.value, 10) });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  async submit() {
    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中' });
    try {
      await api('submitFeedback', {
        type: this.data.types[this.data.typeIndex],
        content,
        contact: this.data.contact.trim()
      });
      wx.showToast({ title: '已提交，感谢反馈', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (e) {
      wx.showToast({ title: e.message || '提交失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
