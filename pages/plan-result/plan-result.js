const { api } = require('../../utils/api.js');

Page({
  data: {
    activeTab: 0,
    stages: [],
    planContent: '',
    currentStage: {}
  },

  async onLoad() {
    wx.showLoading({ title: '加载计划...' });
    try {
      const res = await api('getStudyPlan');
      const plan = res.plan;
      if (!plan || !plan.stages || !plan.stages.length) {
        wx.hideLoading();
        wx.showToast({ title: '暂无计划数据', icon: 'none' });
        return;
      }
      const stages = plan.stages.map((s, i) => ({
        ...s,
        progress: s.progress != null ? s.progress : Math.round(100 / plan.stages.length)
      }));
      this.setData({
        stages,
        planContent: plan.planContent || '',
        currentStage: stages[0],
        activeTab: 0
      });
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeTab: index,
      currentStage: this.data.stages[index]
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  startPlan() {
    wx.reLaunch({ url: '/pages/progress/progress' });
  }
});
