Page({
  data: {
    directions: [
      '英语语言文学',
      '外国语言学及应用语言学',
      '翻译学',
      '学科教学(英语)',
      '比较文学与世界文学',
      '英语笔译'
    ],
    schools: [
      '北京外国语大学',
      '上海外国语大学',
      '北京师范大学',
      '华东师范大学',
      '南京大学',
      '复旦大学',
      '浙江大学',
      '北京大学',
      '清华大学',
      '广东外语外贸大学',
      '四川大学',
      '武汉大学',
      '厦门大学',
      '中山大学',
      '西安外国语大学'
    ],
    directionIndex: -1,
    schoolIndex: -1,
    days: 180,
    studyHours: 4,
    // 薄弱环节单独设置布尔值
    weakness1: false,
    weakness2: false,
    weakness3: false,
    weakness4: false,
    weakness5: false
  },

  onDirectionChange(e) {
    this.setData({ directionIndex: parseInt(e.detail.value) })
  },

  onSchoolChange(e) {
    this.setData({ schoolIndex: parseInt(e.detail.value) })
  },

  onDaysInput(e) {
    this.setData({ days: parseInt(e.detail.value) || 0 })
  },

  decreaseDays() {
    if (this.data.days > 30) {
      this.setData({ days: this.data.days - 10 })
    }
  },

  increaseDays() {
    this.setData({ days: this.data.days + 10 })
  },

  selectHours(e) {
    const hours = parseInt(e.currentTarget.dataset.hours)
    this.setData({ studyHours: hours })
  },

  toggleWeakness(e) {
    const index = e.currentTarget.dataset.index
    const key = 'weakness' + index
    this.setData({
      [key]: !this.data[key]
    })
  },

  getWeaknessArray() {
    const result = []
    if (this.data.weakness1) result.push('词汇')
    if (this.data.weakness2) result.push('阅读')
    if (this.data.weakness3) result.push('写作')
    if (this.data.weakness4) result.push('翻译')
    if (this.data.weakness5) result.push('完形')
    return result
  },

  onGenerate() {
    if (this.data.directionIndex === -1) {
      wx.showToast({ title: '请选择考研方向', icon: 'none' })
      return
    }
    if (this.data.schoolIndex === -1) {
      wx.showToast({ title: '请选择目标院校', icon: 'none' })
      return
    }
    wx.setStorageSync('planConfig', {
      direction: this.data.directions[this.data.directionIndex],
      school: this.data.schools[this.data.schoolIndex],
      days: this.data.days,
      studyHours: this.data.studyHours,
      weakness: this.getWeaknessArray()
    })
    wx.navigateTo({ url: '/pages/plan-generating/plan-generating' })
  },

  goBack() {
    wx.navigateBack()
  }
})
