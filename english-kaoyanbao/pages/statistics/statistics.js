Page({
  data: {
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    chartData: [
      { day: '周一', value: 40 },
      { day: '周二', value: 60 },
      { day: '周三', value: 45 },
      { day: '周四', value: 90 },
      { day: '周五', value: 120 },
      { day: '周六', value: 80 },
      { day: '周日', value: 100 }
    ],
    recentRecords: []
  },

  onLoad() {
    this.generateCalendar();
    this.loadRecentRecords();
  },

  onShow() {
    this.loadRecentRecords();
  },

  generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    // checked dates: simulate some checked days
    const checkedDates = [1, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 21, 22];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '' });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        checked: checkedDates.indexOf(d) !== -1 && d <= today
      });
    }
    this.setData({ calendarDays: days });
  },

  loadRecentRecords() {
    const records = wx.getStorageSync('focusRecords') || [];
    const recent = records.slice(-5).reverse();
    this.setData({ recentRecords: recent });
  }
});