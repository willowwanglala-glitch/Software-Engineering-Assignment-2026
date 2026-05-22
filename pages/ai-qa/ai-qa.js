const { askCoze } = require('../../utils/coze.js');
const { api } = require('../../utils/api.js');
const { getLocalUser } = require('../../utils/auth.js');

const WELCOME =
  '你好！我是你的考研英语助手，已读取你的备考画像，有问题尽管问。';

Page({
  data: {
    messages: [{ role: 'ai', content: WELCOME }],
    inputText: '',
    scrollToId: '',
    conversationId: '',
    profileText: '',
    suggestions: ['阅读提分', '作文模板', '本周计划', '翻译技巧', '完形填空', '长难句'],
    loading: false
  },

  async onLoad() {
    const user = getLocalUser();
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    const school = (user.targetSchool || '').trim();
    const direction = (user.direction || '').trim();
    this.setData({
      profileText: school && direction ? direction + ' · ' + school : '未设置院校，将给出通用建议'
    });
    await this.loadHistory();
    this.scrollToBottom();
  },

  async loadHistory() {
    try {
      const res = await api('listQaLogs', { limit: 15 });
      const list = (res.list || []).slice().reverse();
      if (!list.length) return;
      const messages = [{ role: 'ai', content: WELCOME }];
      list.forEach((log) => {
        if (log.question) messages.push({ role: 'user', content: log.question });
        if (log.answer) messages.push({ role: 'ai', content: log.answer });
      });
      const last = list[list.length - 1];
      this.setData({
        messages,
        conversationId: last.cozeConversationId || last.conversationId || ''
      });
    } catch (e) {
      console.warn('listQaLogs', e);
    }
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendSuggestion(e) {
    const text = e.currentTarget.dataset.text;
    if (text === '本周计划') {
      this.sendWeeklyPlan();
      return;
    }
    this.setData({ inputText: text });
    this.sendMessage();
  },

  async sendWeeklyPlan() {
    const user = getLocalUser();
    this.setData({
      messages: this.data.messages.concat({ role: 'user', content: '查看我的本周学习计划' }),
      loading: true
    });
    this.scrollToBottom();
    try {
      const res = await api('getStudyPlan');
      const plan = res.plan;
      let reply = '你还没有生成备考计划。请从首页进入「备考计划」完成配置与生成。';
      if (plan) {
        const pending = (plan.tasks || []).filter(
          (t) => t.status === 'pending' || t.status === 'doing'
        );
        const top = pending.slice(0, 5).map((t) => '· ' + t.content).join('\n');
        reply =
          (plan.planContent || '已为你生成备考计划。') +
          '\n\n【本周建议优先】\n' +
          (top || '· 暂无待办，可在学习页添加任务');
      } else {
        const cozeRes = await askCoze('根据我的备考画像，给出本周英语学习安排（3-5条具体任务）', {
          user
        });
        reply = cozeRes.content || reply;
      }
      this.setData({
        messages: this.data.messages.concat({ role: 'ai', content: reply }),
        loading: false
      });
    } catch (e) {
      this.setData({
        messages: this.data.messages.concat({
          role: 'ai',
          content: '获取计划失败：' + (e.message || '')
        }),
        loading: false
      });
    }
    this.scrollToBottom();
  },

  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.loading) return;

    const user = getLocalUser();
    const messages = this.data.messages.concat({ role: 'user', content: text });
    this.setData({ messages, inputText: '', loading: true });
    this.scrollToBottom();

    try {
      const res = await askCoze(text, {
        conversationId: this.data.conversationId,
        user
      });
      const reply = res.content || '暂无回答';
      this.setData({
        messages: this.data.messages.concat({ role: 'ai', content: reply }),
        conversationId: res.conversationId || this.data.conversationId,
        loading: false
      });
      try {
        await api('addQaLog', {
          question: text,
          answer: reply,
          conversationId: res.conversationId || ''
        });
      } catch (e) {
        console.warn('addQaLog', e);
      }
    } catch (e) {
      this.setData({
        messages: this.data.messages.concat({
          role: 'ai',
          content: '调用失败：' + (e.message || '请检查 Coze 配置')
        }),
        loading: false
      });
    }
    this.scrollToBottom();
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollToId: 'msg-bottom' });
    }, 100);
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
