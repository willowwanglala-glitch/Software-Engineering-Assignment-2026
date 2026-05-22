const { api } = require('../../utils/api.js');
const { getLocalUser } = require('../../utils/auth.js');

Page({
  data: {
    stats: { totalMinutes: 0, sessionCount: 0 },
    chartList: [],
    sessions: []
  },

  onShow() {
    if (!getLocalUser()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  buildChart(byDate) {
    const dates = Object.keys(byDate || {}).sort();
    const max = Math.max(...dates.map((d) => byDate[d]), 1);
    return dates.map((date) => ({
      date: date.slice(5),
      minutes: byDate[date],
      percent: Math.round((byDate[date] / max) * 100)
    }));
  },

  async loadData() {
    wx.showLoading({ title: '加载中' });
    try {
      const [statsRes, listRes] = await Promise.all([
        api('getWeeklyStats', { days: 7 }),
        api('listFocusSessions', { limit: 10 })
      ]);
      wx.hideLoading();
      this.setData({
        stats: {
          totalMinutes: statsRes.totalMinutes || 0,
          sessionCount: statsRes.sessionCount || 0
        },
        chartList: this.buildChart(statsRes.byDate),
        sessions: listRes.list || []
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  }
});
