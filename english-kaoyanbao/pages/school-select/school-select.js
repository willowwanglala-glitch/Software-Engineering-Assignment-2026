Page({
  data: {
    selected: -1,
    directions: [
      '英语语言文学',
      '外国语言学及应用语言学',
      '翻译学',
      '学科教学(英语)',
      '比较文学与世界文学',
      '英语笔译'
    ]
  },

  onSelect(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ selected: index })
  },

  onConfirm() {
    if (this.data.selected === -1) {
      wx.showToast({ title: '请选择考研方向', icon: 'none' })
      return
    }
    const direction = this.data.directions[this.data.selected]
    wx.setStorageSync('selectedDirection', direction)
    wx.navigateTo({
      url: '/pages/school-list/school-list?direction=' + encodeURIComponent(direction)
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
