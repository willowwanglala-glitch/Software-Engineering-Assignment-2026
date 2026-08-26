const { api } = require('../../utils/api.js');

const EXAM_TYPES = [
  { id: '', label: '全部' },
  { id: 'english1', label: '英语一' },
  { id: 'english2', label: '英语二' }
];

const ESSAY_TYPES = [
  { id: '', label: '全部' },
  { id: 'big', label: '大作文' },
  { id: 'small', label: '小作文' }
];

Page({
  data: {
    examTypes: EXAM_TYPES,
    essayTypes: ESSAY_TYPES,
    activeExam: '',
    activeEssay: '',
    sampleList: [],
    loading: true
  },

  onLoad() {
    this.loadSamples();
  },

  async loadSamples() {
    this.setData({ loading: true });
    try {
      const res = await api('listEssaySamples', {
        examType: this.data.activeExam || undefined,
        essayType: this.data.activeEssay || undefined
      });
      const list = (res.list || []).map((item) => ({
        ...item,
        examLabel: item.examType === 'english1' ? '英语一' : '英语二',
        typeLabel: item.essayType === 'big' ? '大作文' : '小作文'
      }));
      this.setData({ sampleList: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onExamFilter(e) {
    this.setData({ activeExam: e.currentTarget.dataset.id });
    this.loadSamples();
  },

  onEssayFilter(e) {
    this.setData({ activeEssay: e.currentTarget.dataset.id });
    this.loadSamples();
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/essay-sample-detail/essay-sample-detail?id=' + id });
  },

  goBack() {
    wx.navigateBack();
  }
});
