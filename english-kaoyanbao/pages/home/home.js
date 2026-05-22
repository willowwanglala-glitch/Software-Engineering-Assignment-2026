Page({
  data: {
    username: ''
  },

  onLoad() {
    const user = wx.getStorageSync('currentUser')
    if (user && user.username) {
      this.setData({ username: user.username })
    }
  },

  onShow() {
    const user = wx.getStorageSync('currentUser')
    if (user && user.username) {
      this.setData({ username: user.username })
    }
  },

  goSchoolSelect() {
    wx.navigateTo({ url: '/pages/school-select/school-select' })
  },

  goPlanSetup() {
    wx.navigateTo({ url: '/pages/plan-setup/plan-setup' })
  },

  goFocusTimer() {
    wx.navigateTo({ url: '/pages/focus-timer/focus-timer' })
  },

  goStatistics() {
    wx.switchTab({ url: '/pages/statistics/statistics' })
  },

  goAiQa() {
    wx.navigateTo({ url: '/pages/ai-qa/ai-qa' })
  },

  goEssayReview() {
    wx.navigateTo({ url: '/pages/essay-review/essay-review' })
  },

  goProgress() {
    wx.switchTab({ url: '/pages/progress/progress' })
  }
})
