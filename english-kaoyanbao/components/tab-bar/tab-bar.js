Component({
  properties: {
    active: { type: String, value: 'home' }
  },
  methods: {
    switchTab(e) {
      wx.switchTab({ url: e.currentTarget.dataset.url })
    }
  }
})
