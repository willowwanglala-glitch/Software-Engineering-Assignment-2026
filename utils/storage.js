const KEYS = {
  user: 'lfl_user',
  focus: 'lfl_focus_sessions',
  qa: 'lfl_qa_logs',
  studyPlan: 'lfl_study_plan',
  essayReviews: 'lfl_essay_reviews',
  adminToken: 'lfl_admin_token'
};

function getUser() {
  return wx.getStorageSync(KEYS.user) || null;
}

function setUser(user) {
  wx.setStorageSync(KEYS.user, user);
}

function getFocusList() {
  return wx.getStorageSync(KEYS.focus) || [];
}

function addFocusSession(session) {
  const list = getFocusList();
  list.unshift({ ...session, _id: 'local_' + Date.now(), createdAt: Date.now() });
  wx.setStorageSync(KEYS.focus, list);
  return list[0];
}

function addQaLog(log) {
  const list = wx.getStorageSync(KEYS.qa) || [];
  list.unshift({ ...log, _id: 'local_' + Date.now(), createdAt: Date.now() });
  wx.setStorageSync(KEYS.qa, list);
  return list[0];
}

function getQaList() {
  return wx.getStorageSync(KEYS.qa) || [];
}

function getWeeklyStatsLocal(days) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const list = getFocusList().filter((s) => (s.createdAt || 0) >= since);
  const byDate = {};
  const byMode = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalMinutes = 0;
  list.forEach((s) => {
    totalMinutes += s.durationMinutes || 0;
    const d =
      s.date ||
      new Date(s.createdAt).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + (s.durationMinutes || 0);
    const mode = s.studyMode || 1;
    byMode[mode] = (byMode[mode] || 0) + (s.durationMinutes || 0);
  });
  return { totalMinutes, sessionCount: list.length, byDate, byMode };
}

function getStudyPlan() {
  return wx.getStorageSync(KEYS.studyPlan) || null;
}

function setStudyPlan(plan) {
  wx.setStorageSync(KEYS.studyPlan, plan);
}

function addEssayReview(review) {
  const list = wx.getStorageSync(KEYS.essayReviews) || [];
  list.unshift({ ...review, _id: 'local_' + Date.now(), createdAt: Date.now() });
  wx.setStorageSync(KEYS.essayReviews, list);
  return list[0];
}

function getEssayReviews() {
  return wx.getStorageSync(KEYS.essayReviews) || [];
}

function setAdminToken(token) {
  if (token) wx.setStorageSync(KEYS.adminToken, token);
  else wx.removeStorageSync(KEYS.adminToken);
}

function getAdminToken() {
  return wx.getStorageSync(KEYS.adminToken) || '';
}

function getAdminStatsLocal() {
  const user = getUser();
  const focusList = getFocusList();
  const qaList = getQaList();
  const plan = getStudyPlan();
  const users = user ? 1 : 0;
  const totalMinutes = focusList.reduce((s, x) => s + (x.durationMinutes || 0), 0);
  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const dayBuckets = [0, 0, 0, 0, 0, 0, 0];
  const weekAgo = Date.now() - 7 * 86400000;
  focusList
    .filter((s) => (s.createdAt || 0) >= weekAgo)
    .forEach((s) => {
      const d = new Date(s.createdAt || Date.now());
      const wd = d.getDay();
      const idx = wd === 0 ? 6 : wd - 1;
      dayBuckets[idx] += s.durationMinutes || 0;
    });
  const maxVal = Math.max(...dayBuckets, 1);
  const trendData = dayLabels.map((label, index) => ({
    label,
    value: dayBuckets[index],
    percent: Math.round((dayBuckets[index] / maxVal) * 100)
  }));

  const catalog = require('./catalog.js');
  const schoolList = catalog.UNIVERSITIES.map((u) => ({
    name: u.name,
    tags: u.types || u.tags || [],
    userCount: user && user.targetSchool === u.name ? 1 : 0
  }));

  const maskName = (name) => {
    const n = (name || '用户').trim();
    if (n.length <= 1) return n + '*';
    return n[0] + '**';
  };

  const userRankList = user
    ? [
        {
          name: maskName(user.nickName),
          school: user.targetSchool || '未设置',
          totalTime: Math.round((totalMinutes / 60) * 10) / 10
        }
      ]
    : [{ name: '暂无数据', school: '-', totalTime: 0 }];

  return {
    overview: {
      users: users || 1,
      active: users,
      study: focusList.length,
      ai: qaList.length,
      plans: plan ? 1 : 0
    },
    userRankList,
    schoolList,
    trendData
  };
}

module.exports = {
  getUser,
  setUser,
  getFocusList,
  addFocusSession,
  addQaLog,
  getQaList,
  getWeeklyStatsLocal,
  getStudyPlan,
  setStudyPlan,
  addEssayReview,
  getEssayReviews,
  setAdminToken,
  getAdminToken,
  getAdminStatsLocal
};
