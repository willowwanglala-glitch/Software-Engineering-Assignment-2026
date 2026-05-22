const { api } = require('../../utils/api.js');

Page({
  data: {
    topicList: ['2024英语一大作文', '2024英语二大作文', '2023英语一大作文', '2023英语二大作文'],
    topicIndex: 0,
    essayType: 'big',
    essayContent: '',
    showResult: false,
    showHistory: false,
    historyList: [],
    starIndex: 3,
    reviewResult: {
      score: 0,
      dimensions: [],
      suggestions: { error: [], warning: [], success: [] },
      reference: ''
    }
  },

  onShow() {
    this.loadHistory();
  },

  formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' : '') + n;
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  },

  async loadHistory() {
    try {
      const res = await api('listEssayReviews', { limit: 5 });
      const historyList = (res.list || []).map((item) => ({
        ...item,
        timeLabel: this.formatTime(item.createdAt)
      }));
      this.setData({ historyList });
    } catch (e) {
      console.warn('listEssayReviews', e);
    }
  },

  toggleHistory() {
    this.setData({ showHistory: !this.data.showHistory });
  },

  loadHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.historyList[index];
    if (!item) return;
    const rr = item.reviewResult || {};
    this.setData({
      essayContent: item.essayContent || '',
      essayType: item.essayType || 'big',
      showResult: true,
      reviewResult: rr,
      starIndex: Math.min(5, Math.max(0, Math.round((rr.score || 10) / 3)))
    });
  },

  onTopicChange(e) {
    this.setData({ topicIndex: parseInt(e.detail.value, 10) });
  },

  switchType(e) {
    this.setData({ essayType: e.currentTarget.dataset.type });
  },

  onEssayInput(e) {
    this.setData({ essayContent: e.detail.value });
  },

  async submitEssay() {
    const content = this.data.essayContent.trim();
    if (!content) {
      wx.showToast({ title: '请输入作文内容', icon: 'none' });
      return;
    }
    const topic = this.data.topicList[this.data.topicIndex];
    wx.showLoading({ title: 'AI 批改中...' });

    try {
      const res = await api('submitEssayReview', {
        essayContent: content,
        essayType: this.data.essayType,
        topic,
        useCoze: true
      });
      const reviewResult = res.reviewResult;
      this.setData({
        showResult: true,
        reviewResult,
        starIndex: Math.min(5, Math.max(0, Math.round((reviewResult.score || 10) / 3)))
      });
      await this.loadHistory();
      wx.showToast({
        title: reviewResult.source === 'coze_json' ? 'AI 批改完成' : '批改完成',
        icon: 'success'
      });
    } catch (err) {
      wx.showToast({ title: err.message || '批改失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
