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
      { name: '单词', minutes: 25 },
      { name: '阅读', minutes: 30 },
      { name: '写作', minutes: 40 },
      { name: '翻译', minutes: 35 }
    ],
    todayCount: 0,
    todayMinutes: 0,
    timer: null
  },

  onLoad() {
    this.loadTodayStats();
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  onTaskInput(e) {
    this.setData({ taskName: e.detail.value });
  },

  switchMode(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.isRunning) return;
    const mode = this.data.modes[index];
    const totalSeconds = mode.minutes * 60;
    this.setData({
      activeMode: index,
      currentMode: mode,
      totalSeconds: totalSeconds,
      remainSeconds: totalSeconds,
      displayTime: this.formatTime(totalSeconds),
      progressDeg: 0
    });
  },

  toggleTimer() {
    if (this.data.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    this.setData({ isRunning: true });
    const timer = setInterval(() => {
      let remain = this.data.remainSeconds - 1;
      if (remain <= 0) {
        remain = 0;
        this.completeTimer();
        return;
      }
      const elapsed = this.data.totalSeconds - remain;
      const deg = (elapsed / this.data.totalSeconds) * 360;
      this.setData({
        remainSeconds: remain,
        displayTime: this.formatTime(remain),
        progressDeg: deg
      });
    }, 1000);
    this.setData({ timer: timer });
  },

  pauseTimer() {
    clearInterval(this.data.timer);
    this.setData({ isRunning: false, timer: null });
  },

  completeTimer() {
    clearInterval(this.data.timer);
    const elapsed = this.data.totalSeconds - this.data.remainSeconds;
    const minutes = Math.ceil(elapsed / 60);
    if (minutes > 0) {
      this.saveRecord(minutes);
    }
    const mode = this.data.modes[this.data.activeMode];
    const totalSeconds = mode.minutes * 60;
    this.setData({
      isRunning: false,
      timer: null,
      remainSeconds: totalSeconds,
      displayTime: this.formatTime(totalSeconds),
      progressDeg: 0
    });
    wx.showToast({ title: '专注完成', icon: 'success' });
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

  saveRecord(minutes) {
    const today = this.getTodayStr();
    let records = wx.getStorageSync('focusRecords') || [];
    records.push({
      date: today,
      minutes: minutes,
      mode: this.data.currentMode.name,
      task: this.data.taskName,
      time: new Date().toLocaleTimeString()
    });
    wx.setStorageSync('focusRecords', records);
    this.loadTodayStats();
  },

  loadTodayStats() {
    const today = this.getTodayStr();
    const records = wx.getStorageSync('focusRecords') || [];
    const todayRecords = records.filter(r => r.date === today);
    let count = todayRecords.length;
    let minutes = 0;
    todayRecords.forEach(r => { minutes += r.minutes; });
    this.setData({ todayCount: count, todayMinutes: minutes });
  },

  getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate();
  }
});