const cloud = require('wx-server-sdk');
const catalog = require('./catalog');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const COL = {
  users: 'users',
  universities: 'universities',
  focus_sessions: 'focus_sessions',
  qa_logs: 'qa_logs',
  study_plans: 'study_plans'
};

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

async function getStudyPlan(event, openid) {
  const res = await db
    .collection(COL.study_plans)
    .where({ _openid: openid })
    .limit(1)
    .get();
  if (!res.data.length) {
    return { success: true, plan: null, message: '暂无备考计划，可在 Coze 接入后生成' };
  }
  return { success: true, plan: res.data[0] };
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
      default:
        return { success: false, error: '未知 action: ' + action };
    }
  } catch (e) {
    console.error('backendApi', action, e);
    return { success: false, error: e.message || String(e) };
  }
};
