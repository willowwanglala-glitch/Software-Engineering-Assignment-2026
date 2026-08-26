const { getLocalUser, setLocalUser, needOnboarding } = require('../../utils/auth.js');
const { api } = require('../../utils/api.js');

Page({
  data: {
    username: '同学',
    usernameFirst: '同',
    avatarUrl: '',
    targetSchool: '',
    direction: '',
    studyDaysText: '开始备考之旅',
    todayPoints: 0,
    todayFocusText: '0h',
    taskRateText: '0%',
    currentTaskName: '暂无进行中任务',
    currentTaskPercent: 0,
    currentTaskDesc: '去「进度追踪」添加或开始任务吧',
    weakTags: [],
    weakSuggestName: '',
    hasWeakBlock: false
  },

  onShow() {
    const user = getLocalUser();
    if (!user) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    if (needOnboarding(user)) {
      wx.redirectTo({ url: '/pages/school-select/school-select' });
      return;
    }
    const nick = (user.nickName || '同学').trim();
    this.setData({
      username: nick,
      usernameFirst: nick.slice(0, 1) || '同',
      avatarUrl: user.avatarUrl || '',
      targetSchool: user.targetSchool || '未设置院校',
      direction: user.direction || ''
    });
    this.applyWeakPoints(user.weakPoints || []);
    this.loadOverview();
  },

  applyWeakPoints(weakPoints) {
    const list = Array.isArray(weakPoints) ? weakPoints : [];
    const weakTags = list.slice(0, 4).map((w) => ({
      id: w.id,
      name: w.name,
      count: w.count || 1
    }));
    const top = list[0];
    this.setData({
      weakTags,
      weakSuggestName: top ? top.task || '针对薄弱点做一次专项练习' : '',
      hasWeakBlock: weakTags.length > 0
    });
  },

  async loadOverview() {
    try {
      const [statsRes, taskRes, profileRes] = await Promise.all([
        api('getWeeklyStats', { days: 30 }),
        api('listStudyTasks'),
        api('getUserProfile').catch(() => null)
      ]);

      if (profileRes && profileRes.user) {
        const local = getLocalUser() || {};
        const cloudWeak = profileRes.user.weakPoints;
        const weakPoints =
          Array.isArray(cloudWeak) && cloudWeak.length
            ? cloudWeak
            : local.weakPoints || [];
        const merged = setLocalUser({
          ...local,
          ...profileRes.user,
          weakPoints
        });
        this.applyWeakPoints(merged.weakPoints || []);
      }

      const byDate = statsRes.byDate || [];
      const activeDays = byDate.filter((d) => (d.totalMinutes || d.minutes || 0) > 0).length;
      const todayKey = this.getTodayStr();
      const today = byDate.find((d) => d.date === todayKey) || {};
      const todayMinutes = today.totalMinutes || today.minutes || 0;
      const todayPoints = Math.min(999, Math.round(todayMinutes * 4));
      const hours = (todayMinutes / 60).toFixed(1);

      const tasks = taskRes.tasks || taskRes.list || [];
      const done = tasks.filter((t) => t.status === 'done').length;
      const weakTask = tasks.find(
        (t) =>
          (t.status === 'todo' || t.status === 'doing') &&
          String(t.name || '').indexOf('【薄弱点·') !== -1
      );
      const doing =
        tasks.find((t) => t.status === 'doing') ||
        weakTask ||
        tasks.find((t) => t.status === 'todo');
      const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

      this.setData({
        studyDaysText: activeDays > 0 ? `近30天学习 ${activeDays} 天` : '开始备考之旅',
        todayPoints,
        todayFocusText: hours + 'h',
        taskRateText: rate + '%',
        currentTaskName: doing ? doing.title || doing.name || '进行中任务' : '暂无进行中任务',
        currentTaskPercent: doing && doing.status === 'doing' ? 50 : doing ? 0 : 0,
        currentTaskDesc: doing
          ? String(doing.name || '').indexOf('【薄弱点·') !== -1
            ? '来自 AI 答疑薄弱点 · 可在进度页勾选完成'
            : doing.status === 'doing'
              ? '正在进行，加油！'
              : '待开始 · 可在进度页更新状态'
          : '去「进度追踪」添加或开始任务吧'
      });
    } catch (e) {
      console.warn('home loadOverview', e);
    }
  },

  getTodayStr() {
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  },

  goSchoolSelect() {
    wx.navigateTo({ url: '/pages/school-select/school-select' });
  },

  goPlanSetup() {
    wx.navigateTo({ url: '/pages/plan-setup/plan-setup' });
  },

  goFocusTimer() {
    wx.navigateTo({ url: '/pages/focus-timer/focus-timer' });
  },

  goStatistics() {
    wx.reLaunch({ url: '/pages/statistics/statistics' });
  },

  goAiQa() {
    wx.navigateTo({ url: '/pages/ai-qa/ai-qa' });
  },

  goFaq() {
    wx.navigateTo({ url: '/pages/faq/faq' });
  },

  goEssayReview() {
    wx.navigateTo({ url: '/pages/essay-review/essay-review' });
  },

  goEssaySamples() {
    wx.navigateTo({ url: '/pages/essay-samples/essay-samples' });
  },

  goProgress() {
    wx.reLaunch({ url: '/pages/progress/progress' });
  }
});
