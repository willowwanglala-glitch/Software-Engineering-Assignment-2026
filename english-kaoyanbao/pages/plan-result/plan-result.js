Page({
  data: {
    activeTab: 0,
    stages: [
      {
        name: '基础阶段',
        dayRange: '第1-60天',
        progress: 33,
        tasks: ['词汇背诵50词', '长难句分析5句', '阅读精读1篇'],
        weeklyGoal: '完成1套真题阅读',
        materials: ['《考研英语词汇闪过》', '《长难句解密》']
      },
      {
        name: '强化阶段',
        dayRange: '第61-120天',
        progress: 33,
        tasks: ['词汇复习30词', '真题阅读2篇', '写作模板积累'],
        weeklyGoal: '完成1套完整真题+作文2篇',
        materials: ['《考研英语历年真题》', '《考研英语高分写作》']
      },
      {
        name: '冲刺阶段',
        dayRange: '第121-180天',
        progress: 34,
        tasks: ['全真模拟1套', '错题复盘', '作文批改'],
        weeklyGoal: '3套全真模拟+作文专项训练',
        materials: ['《考研英语考前预测》', '《冲刺密卷》']
      }
    ],
    currentStage: {}
  },

  onLoad() {
    this.setData({
      currentStage: this.data.stages[0]
    });
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeTab: index,
      currentStage: this.data.stages[index]
    });
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  startPlan() {
    wx.switchTab({
      url: '/pages/progress/progress'
    });
  }
});