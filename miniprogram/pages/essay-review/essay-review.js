const { api } = require('../../utils/api.js');
const { countWords } = require('../../utils/essayReview.js');

Page({
  data: {
    topicList: ['2024英语一大作文', '2024英语二大作文', '2023英语一大作文', '2023英语二大作文'],
    topicIndex: 0,
    essayType: 'big',
    essayContent: '',
    wordCount: 0,
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

  async onLoad(options) {
    await this.loadTopics();
    if (options.topic) {
      const topic = decodeURIComponent(options.topic);
      const idx = this.data.topicList.indexOf(topic);
      if (idx >= 0) {
        this.setData({ topicIndex: idx });
      } else {
        this.setData({
          topicList: [topic].concat(this.data.topicList),
          topicIndex: 0
        });
      }
    }
  },

  async loadTopics() {
    try {
      const res = await api('listEssayTopics');
      const topics = res.topics || [];
      if (topics.length) {
        this.setData({ topicList: topics });
      }
    } catch (e) {
      console.warn('listEssayTopics', e);
    }
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
      starIndex: Math.min(5, Math.max(0, Math.round((rr.score || 0) / 4))),
      wordCount: countWords(item.essayContent || '')
    });
  },

  onTopicChange(e) {
    this.setData({ topicIndex: parseInt(e.detail.value, 10) });
  },

  switchType(e) {
    this.setData({ essayType: e.currentTarget.dataset.type });
  },

  onEssayInput(e) {
    const essayContent = e.detail.value || '';
    this.setData({
      essayContent,
      wordCount: countWords(essayContent)
    });
  },

  async submitEssay() {
    const content = this.data.essayContent.trim();
    if (!content) {
      wx.showToast({ title: '请输入作文内容', icon: 'none' });
      return;
    }
    const words = countWords(content);
    if (words < 5) {
      wx.showModal({
        title: '篇幅过短',
        content:
          '当前约 ' +
          words +
          ' 个英文单词。考研作文需要完整段落，继续提交将得到很低分数。是否仍要批改？',
        confirmText: '仍要批改',
        success: (r) => {
          if (r.confirm) this.doSubmitEssay(content);
        }
      });
      return;
    }
    this.doSubmitEssay(content);
  },

  async doSubmitEssay(content) {
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
        wordCount: reviewResult.wordCount != null ? reviewResult.wordCount : countWords(content),
        starIndex: Math.min(5, Math.max(0, Math.round((reviewResult.score || 0) / 4)))
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
  },

  goSamples() {
    wx.navigateTo({ url: '/pages/essay-samples/essay-samples' });
  }
});
