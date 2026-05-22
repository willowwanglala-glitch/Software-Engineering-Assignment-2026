const { getLocalUser, needOnboarding } = require('../../utils/auth.js');

Page({
  data: {
    username: '同学',
    targetSchool: '',
    direction: ''
  },

  onShow() {
    const user = getLocalUser();
    if (!user) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    if (needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/school-select/school-select' });
      return;
    }
    this.setData({
      username: user.nickName || '同学',
      targetSchool: user.targetSchool || '未设置院校',
      direction: user.direction || ''
    });
  },

  goSchoolSelect() {
    wx.navigateTo({ url: '/pages/school-select/school-select' });
  },

  goPlanSetup() {
    wx.navigateTo({ url: '/pages/plan-setup/plan-setup' });
  },

  goFocusTimer() {
    wx.navigateTo({ url: '/pages/focus-timer/focus-timer' });
  },

  goStatistics() {
    wx.reLaunch({ url: '/pages/statistics/statistics' });
  },

  goAiQa() {
    wx.navigateTo({ url: '/pages/ai-qa/ai-qa' });
  },

  goEssayReview() {
    wx.navigateTo({ url: '/pages/essay-review/essay-review' });
  },

  goProgress() {
    wx.reLaunch({ url: '/pages/progress/progress' });
  }
});
