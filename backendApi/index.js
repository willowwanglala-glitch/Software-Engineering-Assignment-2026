const cloud = require('wx-server-sdk');
const catalog = require('./catalog');
const { buildStudyPlan } = require('./planBuilder');
const { buildEssayReviewResult, buildEssayCozePrompt } = require('./essayReview');
const { callCozeChat } = require('./cozeClient');
const { generatePlanWithCoze } = require('./planCoze');
const { syncStageProgress } = require('./planProgress');
const {
  createAdminToken,
  validateAdminToken,
  checkAdminCredentials
} = require('./adminAuth');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const MAX_ESSAY_LEN = 2000;
const MIN_PLAN_DAYS = 90;
const MAX_PLAN_DAYS = 365;

const COL = {
  users: 'users',
  universities: 'universities',
  focus_sessions: 'focus_sessions',
  qa_logs: 'qa_logs',
  study_plans: 'study_plans',
  essay_reviews: 'essay_reviews'
};

function toFrontendStatus(status) {
  if (status === 'completed' || status === 'done') return 'done';
  if (status === 'doing') return 'doing';
  return 'todo';
}

function toBackendStatus(status) {
  if (status === 'done') return 'completed';
  if (status === 'doing') return 'doing';
  return 'pending';
}

function mapTaskForClient(task, index) {
  return {
    id: task.taskId || String(index + 1),
    name: task.content,
    type: task.type || '任务',
    deadline: task.deadline || '',
    status: toFrontendStatus(task.status)
  };
}

async function findUser(openid) {
  const res = await db.collection(COL.users).where({ _openid: openid }).limit(1).get();
  return res.data[0] || null;
}

async function getOrCreateUser(event, openid) {
  const { nickName = '', avatarUrl = '' } = event.data || {};
  const existing = await findUser(openid);
  if (existing) {
    return { success: true, user: existing };
  }
  const now = Date.now();
  const doc = {
    _openid: openid,
    nickName,
    avatarUrl,
    directionId: '',
    direction: '',
    universityId: '',
    targetSchool: '',
    level: 3,
    dailyHours: 2,
    createdAt: now,
    updatedAt: now
  };
  const addRes = await db.collection(COL.users).add({ data: doc });
  return { success: true, user: { ...doc, _id: addRes._id } };
}

async function getUserProfile(event, openid) {
  const user = await findUser(openid);
  if (!user) return { success: false, error: '用户不存在，请先登录' };
  let university = null;
  if (user.universityId) {
    university = await resolveUniversity(user.universityId);
  }
  return { success: true, user, university };
}

async function updateProfile(event, openid) {
  const data = event.data || {};
  const user = await findUser(openid);
  if (!user) return { success: false, error: '用户不存在，请先登录' };

  const patch = { updatedAt: Date.now() };

  if (data.directionId !== undefined || data.universityId !== undefined) {
    const merged = catalog.profileFromSelection(
      data.directionId !== undefined ? data.directionId : user.directionId,
      data.universityId !== undefined ? data.universityId : user.universityId
    );
    Object.assign(patch, merged);
  }
  if (data.direction !== undefined) patch.direction = data.direction;
  if (data.targetSchool !== undefined) patch.targetSchool = data.targetSchool;
  if (data.nickName !== undefined) patch.nickName = data.nickName;
  if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
  if (data.level !== undefined) patch.level = data.level;
  if (data.dailyHours !== undefined) patch.dailyHours = data.dailyHours;

  await db.collection(COL.users).doc(user._id).update({ data: patch });
  return { success: true, user: { ...user, ...patch } };
}

async function resolveUniversity(universityId) {
  const fromCatalog = catalog.getUniversity(universityId);
  if (fromCatalog) return fromCatalog;
  try {
    const res = await db.collection(COL.universities).doc(universityId).get();
    if (res.data) return res.data;
  } catch (e) {
    /* 忽略 */
  }
  return null;
}

async function listDirections() {
  return { success: true, list: catalog.listDirections() };
}

async function listUniversities(event) {
  const { directionId } = event.data || {};
  let list = [];
  try {
    const res = await db.collection(COL.universities).limit(100).get();
    if (res.data && res.data.length) {
      list = res.data;
    }
  } catch (e) {
    /* 集合未创建时使用静态目录 */
  }
  if (!list.length) {
    list = catalog.listUniversities(directionId);
  } else if (directionId) {
    list = list.filter((u) =>
      (u.directions || []).some((d) => d.directionId === directionId)
    );
  }
  return { success: true, list };
}

async function getUniversityDetail(event) {
  const { universityId } = event.data || {};
  if (!universityId) return { success: false, error: '缺少 universityId' };
  const university = await resolveUniversity(universityId);
  if (!university) return { success: false, error: '院校不存在' };
  return { success: true, university };
}

async function seedUniversities() {
  const col = db.collection(COL.universities);
  const existing = await col.count();
  if (existing.total > 0) {
    return { success: true, message: '院校数据已存在，跳过', count: existing.total };
  }
  const now = Date.now();
  for (const u of catalog.UNIVERSITIES) {
    await col.add({
      data: {
        ...u,
        createdAt: now
      }
    });
  }
  return { success: true, message: '已导入 15 所院校', count: catalog.UNIVERSITIES.length };
}

async function addFocusSession(event, openid) {
  const { durationMinutes, subject = '英语', studyMode = 1 } = event.data || {};
  if (!durationMinutes || durationMinutes <= 0) {
    return { success: false, error: '专注时长无效' };
  }
  const now = Date.now();
  const doc = {
    _openid: openid,
    durationMinutes,
    subject,
    studyMode,
    date: new Date(now).toISOString().slice(0, 10),
    startTime: now - durationMinutes * 60 * 1000,
    endTime: now,
    createdAt: now
  };
  const res = await db.collection(COL.focus_sessions).add({ data: doc });
  return { success: true, session: { ...doc, _id: res._id } };
}

async function listFocusSessions(event, openid) {
  const limit = Math.min(event.data?.limit || 30, 100);
  const res = await db
    .collection(COL.focus_sessions)
    .where({ _openid: openid })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return { success: true, list: res.data };
}

async function addQaLog(event, openid) {
  const { question, answer, conversationId } = event.data || {};
  if (!question) return { success: false, error: '问题不能为空' };
  const now = Date.now();
  const doc = {
    _openid: openid,
    question,
    answer: answer || '',
    cozeConversationId: conversationId || '',
    createdAt: now
  };
  const res = await db.collection(COL.qa_logs).add({ data: doc });
  return { success: true, log: { ...doc, _id: res._id } };
}

async function listQaLogs(event, openid) {
  const limit = Math.min(event.data?.limit || 20, 50);
  const res = await db
    .collection(COL.qa_logs)
    .where({ _openid: openid })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return { success: true, list: res.data };
}

async function getWeeklyStats(event, openid) {
  const days = event.data?.days || 7;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const res = await db
    .collection(COL.focus_sessions)
    .where({ _openid: openid, createdAt: _.gte(since) })
    .get();
  const byDate = {};
  const byMode = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalMinutes = 0;
  res.data.forEach((s) => {
    totalMinutes += s.durationMinutes || 0;
    const d = s.date || new Date(s.createdAt).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + (s.durationMinutes || 0);
    const mode = s.studyMode || 1;
    byMode[mode] = (byMode[mode] || 0) + (s.durationMinutes || 0);
  });
  return {
    success: true,
    totalMinutes,
    sessionCount: res.data.length,
    byDate,
    byMode
  };
}

async function findStudyPlan(openid) {
  const res = await db.collection(COL.study_plans).where({ _openid: openid }).limit(1).get();
  return res.data[0] || null;
}

function normalizePlanConfig(raw) {
  const config = { ...raw };
  const days = parseInt(config.days, 10) || 180;
  config.days = Math.min(MAX_PLAN_DAYS, Math.max(MIN_PLAN_DAYS, days));
  config.studyHours = Math.min(12, Math.max(1, parseInt(config.studyHours, 10) || 4));
  if (!Array.isArray(config.weakness)) config.weakness = [];
  return config;
}

async function getUserProfileForCoze(openid) {
  const user = await findUser(openid);
  if (!user) return null;
  return {
    direction: user.direction,
    targetSchool: user.targetSchool,
    level: user.level,
    dailyHours: user.dailyHours
  };
}

async function saveStudyPlanDoc(openid, built, existing) {
  const now = Date.now();
  const synced = syncStageProgress({ ...built });
  const doc = { _openid: openid, ...synced, updatedAt: now };
  if (existing) {
    await db.collection(COL.study_plans).doc(existing._id).update({ data: doc });
    return { ...existing, ...doc, _id: existing._id };
  }
  doc.createdAt = now;
  const addRes = await db.collection(COL.study_plans).add({ data: doc });
  return { ...doc, _id: addRes._id };
}

async function getStudyPlan(event, openid) {
  const plan = await findStudyPlan(openid);
  if (!plan) {
    return { success: true, plan: null, message: '暂无备考计划，请先在计划页生成' };
  }
  return { success: true, plan: syncStageProgress(plan) };
}

async function generateStudyPlan(event, openid) {
  const config = normalizePlanConfig(event.data || {});
  if (!config.direction && !config.school) {
    return { success: false, error: '请填写考研方向与目标院校' };
  }
  const existing = await findStudyPlan(openid);
  const userProfile = await getUserProfileForCoze(openid);
  const useCoze = config.useCoze !== false;

  let built;
  let cozeUsed = false;
  if (useCoze) {
    const gen = await generatePlanWithCoze({
      config,
      userProfile,
      callCoze: callCozeChat
    });
    built = gen.plan;
    cozeUsed = gen.cozeUsed;
  } else {
    built = buildStudyPlan(config);
    built.source = 'template';
  }

  const plan = await saveStudyPlanDoc(openid, built, existing);
  return { success: true, plan, cozeUsed };
}

async function listStudyTasks(event, openid) {
  const plan = await findStudyPlan(openid);
  const synced = plan ? syncStageProgress(plan) : null;
  const tasks = (synced && synced.tasks) || [];
  return { success: true, tasks: tasks.map(mapTaskForClient) };
}

async function updateStudyTask(event, openid) {
  const { taskId, id, status } = event.data || {};
  const tid = taskId || id;
  if (!tid || !status) return { success: false, error: '缺少任务或状态' };
  const allowed = ['todo', 'doing', 'done', 'pending', 'completed'];
  if (!allowed.includes(status)) return { success: false, error: '无效状态' };
  const plan = await findStudyPlan(openid);
  if (!plan) return { success: false, error: '暂无备考计划' };
  const tasks = plan.tasks || [];
  const idx = tasks.findIndex((t) => t.taskId === tid || String(t.taskId) === String(tid));
  if (idx < 0) return { success: false, error: '任务不存在' };
  tasks[idx].status = toBackendStatus(status);
  const synced = syncStageProgress({ ...plan, tasks });
  await db.collection(COL.study_plans).doc(plan._id).update({
    data: {
      tasks: synced.tasks,
      stages: synced.stages,
      updatedAt: Date.now()
    }
  });
  return { success: true, task: mapTaskForClient(tasks[idx], idx) };
}

async function addStudyTask(event, openid) {
  const { name, type, deadline } = event.data || {};
  if (!name || !name.trim()) return { success: false, error: '任务名称不能为空' };
  let plan = await findStudyPlan(openid);
  const now = Date.now();
  const newTask = {
    taskId: 't_' + now + '_' + Math.random().toString(36).slice(2, 6),
    content: name.trim(),
    type: type || '自定义',
    stage: '自定义',
    status: 'pending',
    deadline: deadline || new Date(now + 7 * 86400000).toISOString().slice(0, 10),
    createdAt: now
  };
  if (!plan) {
    const built = buildStudyPlan({ direction: '考研英语', school: '目标院校', days: 180, studyHours: 4, weakness: [] });
    plan = { _openid: openid, ...built, tasks: [newTask], createdAt: now, updatedAt: now };
    const addRes = await db.collection(COL.study_plans).add({ data: plan });
    plan._id = addRes._id;
    return { success: true, task: mapTaskForClient(newTask, 0) };
  }
  const tasks = plan.tasks || [];
  tasks.push(newTask);
  await db.collection(COL.study_plans).doc(plan._id).update({ data: { tasks, updatedAt: now } });
  return { success: true, task: mapTaskForClient(newTask, tasks.length - 1) };
}

async function submitEssayReview(event, openid) {
  const { essayContent, essayType, topic, cozeAnswer, useCoze } = event.data || {};
  if (!essayContent || !essayContent.trim()) {
    return { success: false, error: '作文内容不能为空' };
  }
  if (essayContent.length > MAX_ESSAY_LEN) {
    return { success: false, error: '作文内容不能超过 ' + MAX_ESSAY_LEN + ' 字' };
  }

  let answer = cozeAnswer || '';
  if (!answer && useCoze !== false) {
    try {
      const userProfile = await getUserProfileForCoze(openid);
      const prompt = buildEssayCozePrompt(essayContent.trim(), essayType, topic);
      const coze = await callCozeChat({
        question: prompt,
        userId: 'essay_' + openid.slice(-8),
        userProfile,
        conversationId: ''
      });
      answer = coze.content || '';
    } catch (e) {
      console.warn('essay coze fallback', e.message);
    }
  }

  const reviewResult = buildEssayReviewResult(essayContent, answer, essayType, topic);
  const now = Date.now();
  const doc = {
    _openid: openid,
    essayContent: essayContent.trim(),
    essayType: essayType || 'big',
    topic: topic || '',
    reviewResult,
    createdAt: now
  };
  const res = await db.collection(COL.essay_reviews).add({ data: doc });
  return { success: true, review: { ...doc, _id: res._id }, reviewResult };
}

async function listEssayReviews(event, openid) {
  const limit = Math.min(event.data?.limit || 10, 30);
  const res = await db
    .collection(COL.essay_reviews)
    .where({ _openid: openid })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return { success: true, list: res.data };
}

async function adminLogin(event) {
  const { username, password } = event.data || {};
  if (checkAdminCredentials(username, password)) {
    return {
      success: true,
      token: createAdminToken(),
      message: '登录成功'
    };
  }
  return { success: false, error: '账号或密码错误' };
}

function requireAdmin(event) {
  const token = (event.data && event.data.adminToken) || event.adminToken || '';
  if (!validateAdminToken(token)) {
    return { ok: false, error: '未授权，请重新登录管理后台' };
  }
  return { ok: true };
}

async function getAdminStats(event) {
  const auth = requireAdmin(event);
  if (!auth.ok) return { success: false, error: auth.error };
  const [users, focus, qa, plans] = await Promise.all([
    db.collection(COL.users).count(),
    db.collection(COL.focus_sessions).count(),
    db.collection(COL.qa_logs).count(),
    db.collection(COL.study_plans).count()
  ]);

  let userList = [];
  try {
    const uRes = await db.collection(COL.users).limit(100).get();
    userList = uRes.data || [];
  } catch (e) {
    userList = [];
  }

  const schoolMap = {};
  userList.forEach((u) => {
    const school = u.targetSchool || '未设置';
    if (!schoolMap[school]) schoolMap[school] = { name: school, userCount: 0, tags: [] };
    schoolMap[school].userCount += 1;
  });
  catalog.UNIVERSITIES.forEach((u) => {
    const tags = u.types || u.tags || [];
    if (!schoolMap[u.name]) {
      schoolMap[u.name] = { name: u.name, userCount: 0, tags };
    } else if (!schoolMap[u.name].tags.length) {
      schoolMap[u.name].tags = tags;
    }
  });
  const schoolList = Object.values(schoolMap).sort((a, b) => b.userCount - a.userCount);

  let focusList = [];
  try {
    const fRes = await db.collection(COL.focus_sessions).orderBy('createdAt', 'desc').limit(200).get();
    focusList = fRes.data || [];
  } catch (e) {
    focusList = [];
  }

  const userMinutes = {};
  focusList.forEach((s) => {
    const key = s._openid;
    userMinutes[key] = (userMinutes[key] || 0) + (s.durationMinutes || 0);
  });
  const maskName = (name) => {
    const n = (name || '用户').trim();
    if (n.length <= 1) return n + '*';
    return n[0] + '*'.repeat(Math.min(2, n.length - 1));
  };

  const userRankList = userList
    .map((u) => ({
      name: maskName(u.nickName),
      school: u.targetSchool || '未设置',
      totalTime: Math.round(((userMinutes[u._openid] || 0) / 60) * 10) / 10
    }))
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 10);

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

  const overview = {
    users: users.total,
    active: userList.length,
    study: focus.total,
    ai: qa.total,
    plans: plans.total
  };

  return {
    success: true,
    overview,
    userRankList: userRankList.length ? userRankList : [{ name: '暂无数据', school: '-', totalTime: 0 }],
    schoolList,
    trendData
  };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const action = event.action;

  try {
    switch (action) {
      case 'getOrCreateUser':
        return await getOrCreateUser(event, openid);
      case 'getUserProfile':
        return await getUserProfile(event, openid);
      case 'updateProfile':
        return await updateProfile(event, openid);
      case 'listDirections':
        return await listDirections();
      case 'listUniversities':
        return await listUniversities(event);
      case 'getUniversityDetail':
        return await getUniversityDetail(event);
      case 'seedUniversities':
        return await seedUniversities();
      case 'addFocusSession':
        return await addFocusSession(event, openid);
      case 'listFocusSessions':
        return await listFocusSessions(event, openid);
      case 'addQaLog':
        return await addQaLog(event, openid);
      case 'listQaLogs':
        return await listQaLogs(event, openid);
      case 'getWeeklyStats':
        return await getWeeklyStats(event, openid);
      case 'getStudyPlan':
        return await getStudyPlan(event, openid);
      case 'generateStudyPlan':
        return await generateStudyPlan(event, openid);
      case 'listStudyTasks':
        return await listStudyTasks(event, openid);
      case 'updateStudyTask':
        return await updateStudyTask(event, openid);
      case 'addStudyTask':
        return await addStudyTask(event, openid);
      case 'submitEssayReview':
        return await submitEssayReview(event, openid);
      case 'listEssayReviews':
        return await listEssayReviews(event, openid);
      case 'adminLogin':
        return await adminLogin(event);
      case 'getAdminStats':
        return await getAdminStats(event);
      default:
        return { success: false, error: '未知 action: ' + action };
    }
  } catch (e) {
    console.error('backendApi', action, e);
    return { success: false, error: e.message || String(e) };
  }
};
