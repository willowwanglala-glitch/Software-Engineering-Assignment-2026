const { api } = require('../../utils/api.js');
const { getLocalUser } = require('../../utils/auth.js');

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

Page({
  data: {
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    chartData: [],
    recentRecords: [],
    totalMinutes: 0
  },

  onShow() {
    if (!getLocalUser()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中' });
    try {
      const [statsRes, listRes] = await Promise.all([
        api('getWeeklyStats', { days: 7 }),
        api('listFocusSessions', { limit: 10 })
      ]);
      wx.hideLoading();
      const byDate = statsRes.byDate || {};
      const dates = Object.keys(byDate).sort();
      const max = Math.max(...dates.map((d) => byDate[d]), 1);
      const chartData = dates.slice(-7).map((d, i) => ({
        day: WEEK_LABELS[i] || d.slice(5),
        value: byDate[d],
        percent: Math.round((byDate[d] / max) * 100)
      }));
      const recent = (listRes.list || []).map((r) => ({
        date: r.date || '',
        minutes: r.durationMinutes,
        mode: r.subject || '专注',
        task: '',
        time: ''
      }));
      this.setData({
        chartData,
        recentRecords: recent,
        totalMinutes: statsRes.totalMinutes || 0
      });
      this.generateCalendar(byDate);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  generateCalendar(byDate) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: '' });
    for (let d = 1; d <= daysInMonth; d++) {
      const key =
        year +
        '-' +
        (month + 1 < 10 ? '0' : '') +
        (month + 1) +
        '-' +
        (d < 10 ? '0' : '') +
        d;
      days.push({
        day: d,
        checked: !!(byDate && byDate[key] && d <= today)
      });
    }
    this.setData({ calendarDays: days });
  }
});
