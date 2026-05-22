const KEYS = {
  user: 'lfl_user',
  focus: 'lfl_focus_sessions',
  qa: 'lfl_qa_logs'
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

module.exports = {
  getUser,
  setUser,
  getFocusList,
  addFocusSession,
  addQaLog,
  getQaList,
  getWeeklyStatsLocal
};
