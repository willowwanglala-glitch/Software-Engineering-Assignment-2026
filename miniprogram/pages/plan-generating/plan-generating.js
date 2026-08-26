const { api } = require('../../utils/api.js');

Page({
  data: {
    currentStep: 0,
    statusText: '正在分析备考画像…'
  },

  onLoad() {
    this.runGenerate();
  },

  async runGenerate() {
    const config = wx.getStorageSync('planConfig');
    if (!config || !config.direction) {
      wx.showToast({ title: '请先配置计划', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const texts = [
      '正在分析备考画像…',
      '正在匹配院校要求…',
      '正在调用 AI 生成阶段任务…',
      '正在优化每日学习安排…',
      '正在同步至学习进度…'
    ];

    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step <= 4) {
        this.setData({ currentStep: step, statusText: texts[step] });
      }
    }, 900);

    try {
      let res;
      try {
        res = await api('generateStudyPlan', config);
      } catch (e) {
        // 云超时或 Coze 失败时强制模板，保证能进结果页
        console.warn('generateStudyPlan retry template', e);
        this.setData({ statusText: 'AI 较慢，正在生成模板计划…' });
        res = await api('generateStudyPlan', { ...config, useCoze: false });
      }
      clearInterval(timer);
      this.setData({
        currentStep: 5,
        statusText: res.cozeUsed ? 'AI 计划已生成' : '模板计划已生成（可稍后重试 AI）'
      });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/plan-result/plan-result' });
      }, 600);
    } catch (e) {
      clearInterval(timer);
      wx.showToast({ title: e.message || '生成失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  }
});
