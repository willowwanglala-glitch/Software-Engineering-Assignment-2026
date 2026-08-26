const { api } = require('../../utils/api.js');

Page({
  data: {
    faq: null
  },

  async onLoad(options) {
    const faqId = options.id || '';
    if (!faqId) return;
    wx.showLoading({ title: '加载中' });
    try {
      const res = await api('getFaq', { faqId });
      wx.hideLoading();
      this.setData({ faq: res.faq });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  askAi() {
    const q = (this.data.faq && this.data.faq.question) || '';
    wx.navigateTo({ url: '/pages/ai-qa/ai-qa?q=' + encodeURIComponent(q) });
  },

  goBack() {
    wx.navigateBack();
  }
});
