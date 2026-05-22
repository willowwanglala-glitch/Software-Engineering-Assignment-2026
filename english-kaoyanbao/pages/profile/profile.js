Page({
  data: {
    schoolName: '未选择',
    username: '考研人',
    usernameFirst: 'K'
  },

  onShow() {
    // 获取用户名
    const currentUser = wx.getStorageSync('currentUser')
    if (currentUser && currentUser.username) {
      const username = currentUser.username
      const usernameFirst = username.charAt(0).toUpperCase()
      this.setData({ username, usernameFirst })
    }
    
    // 获取选择的院校
    const selectedSchool = wx.getStorageSync('selectedSchool')
    if (selectedSchool && selectedSchool.name) {
      this.setData({ schoolName: selectedSchool.name })
    } else {
      this.setData({ schoolName: '未选择' })
    }
  },

  goAdmin() {
    wx.navigateTo({
      url: '/pages/admin-login/admin-login'
    })
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu
    const tips = {
      favorite: '我的收藏功能开发中',
      notification: '消息通知功能开发中',
      settings: '系统设置功能开发中',
      help: '帮助与反馈功能开发中'
    }
    wx.showToast({
      title: tips[menu] || '功能开发中',
      icon: 'none'
    })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？退出后需要重新登录。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})
