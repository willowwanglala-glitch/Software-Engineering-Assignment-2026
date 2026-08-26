const { api } = require('../../utils/api.js');
const { getLocalUser } = require('../../utils/auth.js');

const TOTAL_SECONDS = 25 * 60;

Page({
  data: {
    remaining: TOTAL_SECONDS,
    display: '25:00',
    running: false,
    paused: false,
    startedAt: 0,
    elapsedBeforePause: 0
  },

  _timer: null,

  onShow() {
    if (!getLocalUser()) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  onUnload() {
    this.clearTimer();
  },

  format(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  tick() {
    const elapsed = this.data.elapsedBeforePause + Math.floor((Date.now() - this.data.startedAt) / 1000);
    const left = Math.max(0, TOTAL_SECONDS - elapsed);
    this.setData({
      remaining: left,
      display: this.format(left)
    });
    if (left <= 0) {
      this.clearTimer();
      this.onComplete();
    }
  },

  onStart() {
    this.clearTimer();
    this.setData({
      running: true,
      paused: false,
      startedAt: Date.now(),
      elapsedBeforePause: 0,
      remaining: TOTAL_SECONDS,
      display: this.format(TOTAL_SECONDS)
    });
    this._timer = setInterval(() => this.tick(), 1000);
  },

  onPause() {
    this.clearTimer();
    const elapsed = this.data.elapsedBeforePause + Math.floor((Date.now() - this.data.startedAt) / 1000);
    this.setData({
      running: false,
      paused: true,
      elapsedBeforePause: elapsed
    });
  },

  onResume() {
    this.setData({ running: true, paused: false, startedAt: Date.now() });
    this._timer = setInterval(() => this.tick(), 1000);
  },

  async saveSession(minutes) {
    if (minutes < 1) return;
    try {
      await api('addFocusSession', {
        durationMinutes: minutes,
        subject: '英语',
        studyMode: 1
      });
      wx.showToast({ title: '已保存 ' + minutes + ' 分钟', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  async onStop() {
    this.clearTimer();
    const elapsed =
      this.data.elapsedBeforePause +
      (this.data.running ? Math.floor((Date.now() - this.data.startedAt) / 1000) : 0);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    this.setData({ running: false, paused: false, remaining: TOTAL_SECONDS, display: '25:00', elapsedBeforePause: 0 });
    await this.saveSession(minutes);
  },

  async onComplete() {
    this.setData({ running: false, paused: false });
    await this.saveSession(25);
    wx.showModal({
      title: '番茄完成',
      content: '恭喜完成 25 分钟专注！',
      showCancel: false
    });
    this.setData({ remaining: TOTAL_SECONDS, display: '25:00', elapsedBeforePause: 0 });
  }
});
