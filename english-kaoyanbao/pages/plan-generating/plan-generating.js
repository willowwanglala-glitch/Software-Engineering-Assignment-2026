Page({
  data: {
    currentStep: 0
  },

  onLoad() {
    this.startSteps()
  },

  startSteps() {
    let step = 0
    const timer = setInterval(() => {
      step++
      this.setData({ currentStep: step })
      if (step >= 5) {
        clearInterval(timer)
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/plan-result/plan-result' })
        }, 500)
      }
    }, 1000)
  }
})
