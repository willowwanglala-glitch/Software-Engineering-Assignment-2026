const { askCoze } = require('../../utils/coze.js');
const { api } = require('../../utils/api.js');
const { getLocalUser, needOnboarding } = require('../../utils/auth.js');

const QUICK_QUESTIONS = [
  { label: '阅读提分', text: '根据我的目标院校，阅读理解应该怎么系统提分？' },
  { label: '作文模板', text: '英语二大作文有哪些稳妥的结构和常用句型？' },
  { label: '本周计划', text: '请根据我的备考背景，帮我制定本周每天的学习安排。' },
  { label: '翻译练习', text: '翻译部分有哪些常见失分点，该如何每天练习？' }
];

Page({
  data: {
    question: '',
    answer: '',
    loading: false,
    conversationId: '',
    profileText: '',
    profileReady: false,
    quickList: QUICK_QUESTIONS
  },

  onShow() {
    const user = getLocalUser();
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    const ready = !needOnboarding(user);
    const direction = (user.direction || '').trim();
    const school = (user.targetSchool || '').trim();
    let profileText = '';
    if (ready && direction && school) {
      profileText = direction + ' · ' + school;
    } else if (ready) {
      profileText = direction || school || '已登录';
    } else {
      profileText = '未设置，回答将为通用建议';
    }
    this.setData({
      profileText,
      profileReady: ready
    });
  },

  onInput(e) {
    this.setData({ question: e.detail.value });
  },

  onQuickAsk(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ question: text });
    this.sendQuestion(text);
  },

  onGoOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  onClearChat() {
    this.setData({
      conversationId: '',
      answer: '',
      question: ''
    });
    wx.showToast({ title: '已开启新对话', icon: 'none' });
  },

  testAI() {
    const q = this.data.question.trim();
    if (!q) {
      wx.showToast({ title: '请输入问题', icon: 'none' });
      return;
    }
    this.sendQuestion(q);
  },

  async sendQuestion(q) {
    const user = getLocalUser();
    this.setData({ loading: true, answer: '' });

    try {
      const res = await askCoze(q, {
        conversationId: this.data.conversationId,
        user
      });
      this.setData({
        answer: res.content,
        conversationId: res.conversationId || this.data.conversationId,
        loading: false
      });
      try {
        await api('addQaLog', {
          question: q,
          answer: res.content,
          conversationId: res.conversationId || this.data.conversationId
        });
      } catch (e) {
        console.warn('save qa log', e);
      }
    } catch (err) {
      this.setData({
        answer: '调用失败: ' + err.message,
        loading: false
      });
    }
  }
});
