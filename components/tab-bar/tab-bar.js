Component({
  properties: {
    active: { type: String, value: 'home' }
  },
  methods: {
    switchTab(e) {
      wx.reLaunch({ url: e.currentTarget.dataset.url })
    }
  }
})
