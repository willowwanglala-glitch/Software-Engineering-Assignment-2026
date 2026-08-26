const { api } = require('../../utils/api.js');

Page({
  data: {
    categories: ['全部'],
    activeCategory: '全部',
    faqList: [],
    loading: true
  },

  async onLoad() {
    await this.loadFaqs();
  },

  async loadFaqs(category) {
    this.setData({ loading: true });
    try {
      const params = category && category !== '全部' ? { category } : {};
      const res = await api('listFaqs', params);
      const categories = ['全部'].concat(res.categories || []);
      this.setData({
        faqList: res.list || [],
        categories,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.loadFaqs(category);
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/faq-detail/faq-detail?id=' + id });
  },

  askAi(e) {
    const question = e.currentTarget.dataset.question;
    wx.navigateTo({
      url: '/pages/ai-qa/ai-qa?q=' + encodeURIComponent(question)
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
