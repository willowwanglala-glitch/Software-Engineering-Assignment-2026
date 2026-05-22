Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    isRegister: false
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  switchMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      confirmPassword: ''
    })
  },

  onSubmit() {
    const { username, password, confirmPassword, isRegister } = this.data
    
    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    if (isRegister) {
      // 注册模式
      if (password !== confirmPassword) {
        wx.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
      if (password.length < 6) {
        wx.showToast({ title: '密码至少6位', icon: 'none' })
        return
      }
      
      // 检查用户是否已存在
      const users = wx.getStorageSync('users') || []
      if (users.find(u => u.username === username)) {
        wx.showToast({ title: '用户名已存在', icon: 'none' })
        return
      }
      
      // 保存新用户
      users.push({ username, password })
      wx.setStorageSync('users', users)
      wx.setStorageSync('currentUser', { username })
      
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 1000)
    } else {
      // 登录模式
      const users = wx.getStorageSync('users') || []
      const user = users.find(u => u.username === username && u.password === password)
      
      if (user) {
        wx.setStorageSync('currentUser', { username })
        wx.switchTab({ url: '/pages/home/home' })
      } else {
        wx.showToast({ title: '用户名或密码错误', icon: 'none' })
      }
    }
  }
})
