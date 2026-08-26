const KEYS = {
  user: 'lfl_user',
  userRegistry: 'lfl_user_registry',
  focus: 'lfl_focus_sessions',
  qa: 'lfl_qa_logs',
  studyPlan: 'lfl_study_plan',
  essayReviews: 'lfl_essay_reviews',
  adminToken: 'lfl_admin_token',
  feedback: 'lfl_feedback'
};

function getUser() {
  return wx.getStorageSync(KEYS.user) || null;
}

function setUser(user) {
  wx.setStorageSync(KEYS.user, user);
  registerUser(user);
}

function getUserRegistry() {
  return wx.getStorageSync(KEYS.userRegistry) || [];
}

/** 本地模式：登记用户供管理后台查看（按 _id 去重更新） */
function registerUser(user) {
  if (!user) return;
  const list = getUserRegistry();
  const id = user._id || 'local_user';
  const entry = {
    _id: id,
    nickName: user.nickName || '用户',
    avatarUrl: user.avatarUrl || '',
    direction: user.direction || '',
    directionId: user.directionId || '',
    targetSchool: user.targetSchool || '',
    universityId: user.universityId || '',
    updatedAt: Date.now()
  };
  const idx = list.findIndex((u) => u._id === id);
  if (idx >= 0) list[idx] = { ...list[idx], ...entry };
  else list.push(entry);
  wx.setStorageSync(KEYS.userRegistry, list);
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
  const registry = getUserRegistry();
  const baseStudents = registry.length ? registry : user ? [user] : [];

  const schoolList = catalog.UNIVERSITIES.map((u) => ({
    name: u.name,
    tags: u.types || u.tags || [],
    userCount: baseStudents.filter((s) => s.targetSchool === u.name).length
  }));

  const maskName = (name) => {
    const n = (name || '用户').trim();
    if (n.length <= 1) return n + '*';
    return n[0] + '**';
  };

  const studentList = baseStudents.map((u) => ({
    _id: u._id,
    nickName: u.nickName || '用户',
    avatarUrl: u.avatarUrl || '',
    direction: u.direction || '未设置',
    targetSchool: u.targetSchool || '未设置',
    totalTime: Math.round((totalMinutes / 60) * 10) / 10
  }));

  const userRankList = studentList.length
    ? studentList
        .map((s) => ({
          name: maskName(s.nickName),
          school: s.targetSchool,
          direction: s.direction,
          totalTime: s.totalTime
        }))
        .sort((a, b) => b.totalTime - a.totalTime)
    : [{ name: '暂无数据', school: '-', direction: '-', totalTime: 0 }];

  const feedbackList = getFeedbackList().slice(0, 20);

  return {
    overview: {
      users: studentList.length || 1,
      active: studentList.length,
      study: focusList.length,
      ai: qaList.length,
      plans: plan ? 1 : 0,
      feedbacks: feedbackList.length
    },
    userRankList,
    studentList,
    schoolList,
    trendData,
    feedbackList
  };
}

function addFeedback(item) {
  const list = wx.getStorageSync(KEYS.feedback) || [];
  const doc = { ...item, _id: 'fb_' + Date.now(), createdAt: Date.now() };
  list.unshift(doc);
  wx.setStorageSync(KEYS.feedback, list);
  return doc;
}

function getFeedbackList() {
  return wx.getStorageSync(KEYS.feedback) || [];
}

module.exports = {
  getUser,
  setUser,
  getUserRegistry,
  registerUser,
  addFeedback,
  getFeedbackList,
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
