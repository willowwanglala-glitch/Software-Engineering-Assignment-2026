const cloud = require('wx-server-sdk');
const catalog = require('./catalog');
const seedData = require('./seedData');
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
const {
  extractFromText,
  mergeWeakPoints,
  buildTaskName
} = require('./weakPoints');

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
  essay_reviews: 'essay_reviews',
  feedbacks: 'feedbacks',
  faqs: 'faqs',
  essay_samples: 'essay_samples'
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
  if (data.weakPoints !== undefined) {
    patch.weakPoints = Array.isArray(data.weakPoints) ? data.weakPoints.slice(0, 5) : [];
  }

  await db.collection(COL.users).doc(user._id).update({ data: patch });
  return { success: true, user: { ...user, ...patch } };
}

async function resolveUniversity(universityId) {
  if (!universityId) return null;
  // 优先云库（控制台导入的最新招生数据），勿被云函数包内旧 catalog 盖住
  try {
    const res = await db.collection(COL.universities).doc(universityId).get();
    if (res.data && (res.data.name || res.data.enrollment)) {
      return { _id: universityId, ...res.data };
    }
  } catch (e) {
    /* 文档 ID 可能不是 u00，继续列表查找 */
  }
  try {
    const res = await db.collection(COL.universities).limit(100).get();
    const found = (res.data || []).find(
      (u) =>
        u._id === universityId ||
        String(u._id) === String(universityId)
    );
    if (found) return found;
  } catch (e) {
    /* 忽略 */
  }
  return catalog.getUniversity(universityId) || null;
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
  return {
    success: true,
    message: `已导入 ${catalog.UNIVERSITIES.length} 所院校`,
    count: catalog.UNIVERSITIES.length
  };
}

async function seedFaqs() {
  const col = db.collection(COL.faqs);
  const existing = await col.count();
  if (existing.total > 0) {
    return { success: true, message: 'FAQ 已存在，跳过', count: existing.total };
  }
  const now = Date.now();
  for (const faq of seedData.FAQS) {
    await col.add({ data: { ...faq, createdAt: now } });
  }
  return { success: true, message: '已导入 FAQ', count: seedData.FAQS.length };
}

async function seedEssaySamples() {
  const col = db.collection(COL.essay_samples);
  const existing = await col.count();
  if (existing.total > 0) {
    return { success: true, message: '作文范文已存在，跳过', count: existing.total };
  }
  const now = Date.now();
  for (const sample of seedData.ESSAY_SAMPLES) {
    await col.add({ data: { ...sample, createdAt: now } });
  }
  return { success: true, message: '已导入作文范文', count: seedData.ESSAY_SAMPLES.length };
}

async function seedContentData() {
  const results = await Promise.all([
    seedUniversities(),
    seedFaqs(),
    seedEssaySamples()
  ]);
  return {
    success: true,
    message: '内容数据导入完成',
    universities: results[0],
    faqs: results[1],
    essaySamples: results[2]
  };
}

async function listFaqs(event) {
  const { category } = event.data || {};
  let list = [];
  try {
    let query = db.collection(COL.faqs);
    if (category) query = query.where({ category });
    const res = await query.orderBy('order', 'asc').limit(100).get();
    list = res.data || [];
  } catch (e) {
    /* 集合未创建时使用静态数据 */
  }
  if (!list.length) {
    list = seedData.listFaqs(category);
  }
  return { success: true, list, categories: seedData.listFaqCategories() };
}

async function getFaq(event) {
  const { faqId } = event.data || {};
  if (!faqId) return { success: false, error: '缺少 faqId' };
  try {
    const res = await db.collection(COL.faqs).doc(faqId).get();
    if (res.data) return { success: true, faq: res.data };
  } catch (e) {
    /* fallback */
  }
  const faq = seedData.getFaq(faqId);
  if (!faq) return { success: false, error: 'FAQ 不存在' };
  return { success: true, faq };
}

async function listEssaySamples(event) {
  const { examType, essayType, year } = event.data || {};
  let list = [];
  try {
    const res = await db.collection(COL.essay_samples).limit(100).get();
    list = res.data || [];
    if (examType) list = list.filter((e) => e.examType === examType);
    if (essayType) list = list.filter((e) => e.essayType === essayType);
    if (year) list = list.filter((e) => e.year === year);
    list.sort((a, b) => b.year - a.year);
  } catch (e) {
    /* fallback */
  }
  if (!list.length) {
    list = seedData.listEssaySamples({ examType, essayType, year });
  }
  return { success: true, list };
}

async function getEssaySample(event) {
  const { sampleId } = event.data || {};
  if (!sampleId) return { success: false, error: '缺少 sampleId' };
  try {
    const res = await db.collection(COL.essay_samples).doc(sampleId).get();
    if (res.data) return { success: true, sample: res.data };
  } catch (e) {
    /* fallback */
  }
  const sample = seedData.getEssaySample(sampleId);
  if (!sample) return { success: false, error: '范文不存在' };
  return { success: true, sample };
}

async function listEssayTopics() {
  let list = [];
  try {
    const res = await db.collection(COL.essay_samples).limit(100).get();
    list = res.data || [];
  } catch (e) {
    /* fallback */
  }
  if (!list.length) list = seedData.ESSAY_SAMPLES;
  const topics = list.map((e) => e.topic).filter((v, i, a) => a.indexOf(v) === i);
  return { success: true, topics };
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

async function ensureWeakStudyTask(openid, weakHit) {
  if (!weakHit) return null;
  const taskName = buildTaskName(weakHit);
  const marker = '【薄弱点·' + weakHit.name + '】';
  let plan = await findStudyPlan(openid);
  const existing = ((plan && plan.tasks) || []).find(
    (t) =>
      (t.status === 'pending' || t.status === 'doing') &&
      String(t.content || '').indexOf(marker) !== -1
  );
  if (existing) {
    return mapTaskForClient(existing, 0);
  }

  const now = Date.now();
  const newTask = {
    taskId: 't_' + now + '_' + Math.random().toString(36).slice(2, 6),
    content: taskName,
    type: weakHit.type || '薄弱点',
    stage: '薄弱点强化',
    status: 'pending',
    deadline: new Date(now + 7 * 86400000).toISOString().slice(0, 10),
    createdAt: now,
    fromWeakPoint: weakHit.id
  };
  if (!plan) {
    const built = buildStudyPlan({
      direction: '考研英语',
      school: '目标院校',
      days: 180,
      studyHours: 4,
      weakness: [weakHit.name]
    });
    plan = { _openid: openid, ...built, tasks: [newTask], createdAt: now, updatedAt: now };
    const addRes = await db.collection(COL.study_plans).add({ data: plan });
    plan._id = addRes._id;
    return mapTaskForClient(newTask, 0);
  }
  const tasks = plan.tasks || [];
  tasks.push(newTask);
  await db.collection(COL.study_plans).doc(plan._id).update({
    data: { tasks, updatedAt: now }
  });
  return mapTaskForClient(newTask, tasks.length - 1);
}

async function addQaLog(event, openid) {
  const { question, answer, conversationId } = event.data || {};
  if (!question) return { success: false, error: '问题不能为空' };
  const now = Date.now();
  const hits = extractFromText(question);
  const doc = {
    _openid: openid,
    question,
    answer: answer || '',
    cozeConversationId: conversationId || '',
    weakTags: hits.map((h) => h.id),
    createdAt: now
  };
  const res = await db.collection(COL.qa_logs).add({ data: doc });

  let weakPoints = [];
  let suggestedTask = null;
  if (hits.length) {
    try {
      const user = await findUser(openid);
      if (user) {
        weakPoints = mergeWeakPoints(user.weakPoints || [], hits);
        await db.collection(COL.users).doc(user._id).update({
          data: { weakPoints, updatedAt: now }
        });
        suggestedTask = await ensureWeakStudyTask(openid, hits[0]);
      }
    } catch (e) {
      console.warn('addQaLog weakPoints', e);
    }
  }

  return {
    success: true,
    log: { ...doc, _id: res._id },
    weakPoints,
    hitTags: hits.map((h) => h.name),
    suggestedTask
  };
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

async function submitFeedback(event, openid) {
  const { type, content, contact } = event.data || {};
  if (!content || !content.trim()) {
    return { success: false, error: '反馈内容不能为空' };
  }
  const now = Date.now();
  const doc = {
    _openid: openid,
    type: type || '其他',
    content: content.trim(),
    contact: contact || '',
    status: 'pending',
    createdAt: now
  };
  const res = await db.collection(COL.feedbacks).add({ data: doc });
  return { success: true, feedback: { ...doc, _id: res._id } };
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
  let feedbackTotal = 0;
  try {
    const fbCount = await db.collection(COL.feedbacks).count();
    feedbackTotal = fbCount.total;
  } catch (e) {
    feedbackTotal = 0;
  }

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

  const studentList = userList.map((u) => ({
    _id: u._id,
    nickName: u.nickName || '用户',
    avatarUrl: u.avatarUrl || '',
    direction: u.direction || '未设置',
    targetSchool: u.targetSchool || '未设置',
    totalTime: Math.round(((userMinutes[u._openid] || 0) / 60) * 10) / 10
  }));

  const userRankList = studentList
    .map((s) => ({
      name: maskName(s.nickName),
      school: s.targetSchool,
      direction: s.direction,
      totalTime: s.totalTime
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

  let feedbackList = [];
  try {
    const fbRes = await db
      .collection(COL.feedbacks)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    feedbackList = fbRes.data || [];
  } catch (e) {
    feedbackList = [];
  }

  const overview = {
    users: users.total,
    active: userList.length,
    study: focus.total,
    ai: qa.total,
    plans: plans.total,
    feedbacks: feedbackTotal
  };

  return {
    success: true,
    overview,
    feedbackList,
    studentList,
    userRankList: userRankList.length
      ? userRankList
      : [{ name: '暂无数据', school: '-', direction: '-', totalTime: 0 }],
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
      case 'seedContentData':
        return await seedContentData();
      case 'listFaqs':
        return await listFaqs(event);
      case 'getFaq':
        return await getFaq(event);
      case 'listEssaySamples':
        return await listEssaySamples(event);
      case 'getEssaySample':
        return await getEssaySample(event);
      case 'listEssayTopics':
        return await listEssayTopics();
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
      case 'submitFeedback':
        return await submitFeedback(event, openid);
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
