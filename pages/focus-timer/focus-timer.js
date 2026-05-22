const { api } = require('../../utils/api.js');
const { getLocalUser } = require('../../utils/auth.js');

Page({
  data: {
    taskName: '',
    isRunning: false,
    totalSeconds: 25 * 60,
    remainSeconds: 25 * 60,
    displayTime: '25:00',
    progressDeg: 0,
    activeMode: 0,
    currentMode: { name: '单词', minutes: 25 },
    modes: [
      { name: '单词', minutes: 25, studyMode: 1 },
      { name: '阅读', minutes: 30, studyMode: 2 },
      { name: '写作', minutes: 40, studyMode: 3 },
      { name: '翻译', minutes: 35, studyMode: 4 }
    ],
    todayCount: 0,
    todayMinutes: 0,
    timer: null
  },

  onShow() {
    if (!getLocalUser()) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadTodayStats();
  },

  onUnload() {
    if (this.data.timer) clearInterval(this.data.timer);
  },

  onTaskInput(e) {
    this.setData({ taskName: e.detail.value });
  },

  switchMode(e) {
    if (this.data.isRunning) return;
    const index = Number(e.currentTarget.dataset.index);
    const mode = this.data.modes[index];
    const totalSeconds = mode.minutes * 60;
    this.setData({
      activeMode: index,
      currentMode: mode,
      totalSeconds,
      remainSeconds: totalSeconds,
      displayTime: this.formatTime(totalSeconds),
      progressDeg: 0
    });
  },

  toggleTimer() {
    if (this.data.isRunning) this.pauseTimer();
    else this.startTimer();
  },

  startTimer() {
    this.setData({ isRunning: true });
    const timer = setInterval(() => {
      let remain = this.data.remainSeconds - 1;
      if (remain <= 0) {
        this.completeTimer();
        return;
      }
      const elapsed = this.data.totalSeconds - remain;
      this.setData({
        remainSeconds: remain,
        displayTime: this.formatTime(remain),
        progressDeg: (elapsed / this.data.totalSeconds) * 360
      });
    }, 1000);
    this.setData({ timer });
  },

  pauseTimer() {
    clearInterval(this.data.timer);
    this.setData({ isRunning: false, timer: null });
  },

  async completeTimer() {
    clearInterval(this.data.timer);
    const elapsed = this.data.totalSeconds - this.data.remainSeconds;
    const minutes = Math.max(1, Math.ceil(elapsed / 60));
    const mode = this.data.modes[this.data.activeMode];
    try {
      await api('addFocusSession', {
        durationMinutes: minutes,
        subject: mode.name,
        studyMode: mode.studyMode
      });
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
    const totalSeconds = mode.minutes * 60;
    this.setData({
      isRunning: false,
      timer: null,
      remainSeconds: totalSeconds,
      displayTime: this.formatTime(totalSeconds),
      progressDeg: 0
    });
    wx.showToast({ title: '专注完成', icon: 'success' });
    this.loadTodayStats();
  },

  addFiveMin() {
    if (this.data.isRunning) return;
    const newTotal = this.data.totalSeconds + 5 * 60;
    this.setData({
      totalSeconds: newTotal,
      remainSeconds: newTotal,
      displayTime: this.formatTime(newTotal),
      progressDeg: 0
    });
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  },

  async loadTodayStats() {
    try {
      const res = await api('listFocusSessions', { limit: 50 });
      const today = this.getTodayStr();
      const todayRecords = (res.list || []).filter((r) => {
        const d = r.date || new Date(r.createdAt).toISOString().slice(0, 10);
        return d === today;
      });
      let minutes = 0;
      todayRecords.forEach((r) => {
        minutes += r.durationMinutes || 0;
      });
      this.setData({
        todayCount: todayRecords.length,
        todayMinutes: minutes
      });
    } catch (e) {
      console.warn('loadTodayStats', e);
    }
  },

  getTodayStr() {
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
});
