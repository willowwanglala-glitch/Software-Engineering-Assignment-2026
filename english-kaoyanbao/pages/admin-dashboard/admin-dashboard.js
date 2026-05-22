Page({
  data: {
    activeTab: 'users',
    overview: {
      users: 156,
      active: 89,
      study: 234,
      ai: 178
    },
    userRankList: [],
    schoolList: [],
    trendData: []
  },

  onShow() {
    const loggedIn = wx.getStorageSync('adminLoggedIn');
    if (!loggedIn) {
      wx.redirectTo({
        url: '/pages/admin-login/admin-login'
      });
      return;
    }

    // 初始化数据
    this.initUserRankList();
    this.initSchoolList();
    this.initTrendData();
  },

  // 初始化用户时长排名（按总时长降序）
  initUserRankList() {
    const userRankList = [
      { name: '王同学', school: '北京大学', totalTime: 128.5 },
      { name: '张同学', school: '清华大学', totalTime: 115.2 },
      { name: '李同学', school: '复旦大学', totalTime: 98.7 },
      { name: '赵同学', school: '上海外国语大学', totalTime: 87.3 },
      { name: '刘同学', school: '北京师范大学', totalTime: 76.8 },
      { name: '陈同学', school: '南京大学', totalTime: 65.4 },
      { name: '杨同学', school: '浙江大学', totalTime: 54.2 },
      { name: '黄同学', school: '广东外语外贸大学', totalTime: 43.6 },
      { name: '周同学', school: '华东师范大学', totalTime: 38.9 },
      { name: '吴同学', school: '北京外国语大学', totalTime: 32.1 }
    ];
    this.setData({ userRankList });
  },

  // 初始化院校列表
  initSchoolList() {
    const schoolList = [
      { name: '北京外国语大学', tags: ['211', '外语类'], userCount: 23 },
      { name: '上海外国语大学', tags: ['211', '外语类'], userCount: 19 },
      { name: '北京大学', tags: ['985', '综合'], userCount: 18 },
      { name: '北京师范大学', tags: ['985', '师范'], userCount: 16 },
      { name: '复旦大学', tags: ['985', '综合'], userCount: 15 },
      { name: '华东师范大学', tags: ['985', '师范'], userCount: 14 },
      { name: '南京大学', tags: ['985', '综合'], userCount: 12 },
      { name: '浙江大学', tags: ['985', '综合'], userCount: 11 },
      { name: '清华大学', tags: ['985', '综合'], userCount: 10 },
      { name: '广东外语外贸大学', tags: ['外语类'], userCount: 9 },
      { name: '四川大学', tags: ['985', '综合'], userCount: 8 },
      { name: '武汉大学', tags: ['985', '综合'], userCount: 7 },
      { name: '厦门大学', tags: ['985', '综合'], userCount: 6 },
      { name: '中山大学', tags: ['985', '综合'], userCount: 5 },
      { name: '西安外国语大学', tags: ['外语类'], userCount: 4 }
    ];
    this.setData({ schoolList });
  },

  // 初始化学习趋势数据
  initTrendData() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const values = [45, 62, 38, 71, 55, 89, 67];
    const maxVal = Math.max(...values);
    const trendData = days.map((label, index) => ({
      label,
      value: values[index],
      percent: Math.round((values[index] / maxVal) * 100)
    }));
    this.setData({ trendData });
  },

  // Tab切换
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  goBack() {
    wx.navigateBack();
  },

  logoutAdmin() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理后台吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('adminLoggedIn');
          wx.navigateBack();
        }
      }
    });
  }
});
