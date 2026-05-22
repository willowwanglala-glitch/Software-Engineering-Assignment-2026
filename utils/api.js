const storage = require('./storage.js');
const catalog = require('./catalog.js');
const { buildStudyPlan } = require('./planBuilder.js');
const { buildEssayReviewResult, buildEssayCozePrompt } = require('./essayReview.js');
const { generatePlanWithCoze } = require('./planCoze.js');
const { syncStageProgress } = require('./planProgress.js');
const {
  createAdminToken,
  validateAdminToken,
  checkAdminCredentials
} = require('./adminAuth.js');
const { askCoze } = require('./coze.js');

const MIN_PLAN_DAYS = 90;
const MAX_PLAN_DAYS = 365;
const MAX_ESSAY_LEN = 2000;

function normalizePlanConfig(raw) {
  const config = { ...raw };
  const days = parseInt(config.days, 10) || 180;
  config.days = Math.min(MAX_PLAN_DAYS, Math.max(MIN_PLAN_DAYS, days));
  config.studyHours = Math.min(12, Math.max(1, parseInt(config.studyHours, 10) || 4));
  if (!Array.isArray(config.weakness)) config.weakness = [];
  return config;
}

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

function useCloud() {
  const app = getApp();
  return !!(app && app.globalData && app.globalData.env && wx.cloud);
}

function callCloud(action, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'backendApi',
      data: { action, data },
      success: (res) => {
        const result = res.result || {};
        if (result.success) resolve(result);
        else reject(new Error(result.error || '请求失败'));
      },
      fail: (err) => reject(new Error(err.errMsg || '云函数调用失败'))
    });
  });
}

const localApi = {
  async getOrCreateUser(data) {
    let user = storage.getUser();
    if (!user) {
      user = {
        _id: 'local_user',
        nickName: data.nickName || '本地用户',
        avatarUrl: data.avatarUrl || '',
        directionId: '',
        direction: '',
        universityId: '',
        targetSchool: '',
        level: 3,
        dailyHours: 2,
        isLocal: true
      };
      storage.setUser(user);
    } else if (data.nickName) {
      user.nickName = data.nickName;
      user.avatarUrl = data.avatarUrl || user.avatarUrl;
      storage.setUser(user);
    }
    return { user };
  },

  async getUserProfile() {
    const user = storage.getUser();
    if (!user) return { success: false, error: '用户不存在' };
    const university = user.universityId
      ? catalog.getUniversity(user.universityId)
      : null;
    return { user, university };
  },

  async updateProfile(data) {
    const app = getApp();
    const user = storage.getUser() || (app && app.globalData.user) || {};
    if (data.directionId !== undefined || data.universityId !== undefined) {
      Object.assign(
        user,
        catalog.profileFromSelection(
          data.directionId !== undefined ? data.directionId : user.directionId,
          data.universityId !== undefined ? data.universityId : user.universityId
        )
      );
    }
    Object.assign(user, data);
    storage.setUser(user);
    if (app) app.globalData.user = user;
    return { user };
  },

  async listDirections() {
    return { list: catalog.listDirections() };
  },

  async listUniversities(data) {
    return { list: catalog.listUniversities(data.directionId) };
  },

  async getUniversityDetail(data) {
    const university = catalog.getUniversity(data.universityId);
    if (!university) throw new Error('院校不存在');
    return { university };
  },

  async addFocusSession(data) {
    const session = storage.addFocusSession({
      durationMinutes: data.durationMinutes,
      subject: data.subject || '英语',
      studyMode: data.studyMode || 1,
      date: new Date().toISOString().slice(0, 10)
    });
    return { session };
  },

  async listFocusSessions(data) {
    const list = storage.getFocusList().slice(0, data.limit || 30);
    return { list };
  },

  async addQaLog(data) {
    const log = storage.addQaLog({
      question: data.question,
      answer: data.answer,
      conversationId: data.conversationId
    });
    return { log };
  },

  async listQaLogs(data) {
    const list = (storage.getQaList && storage.getQaList()) || [];
    return { list: list.slice(0, data.limit || 20) };
  },

  async getWeeklyStats(data) {
    return storage.getWeeklyStatsLocal(data.days || 7);
  },

  async getStudyPlan() {
    const plan = storage.getStudyPlan();
    return { plan: plan ? syncStageProgress(plan) : null };
  },

  async generateStudyPlan(data) {
    const config = normalizePlanConfig(data);
    if (!config.direction && !config.school) throw new Error('请填写考研方向与目标院校');
    const user = storage.getUser();
    let built;
    let cozeUsed = false;
    if (data.useCoze !== false) {
      const gen = await generatePlanWithCoze(config, user);
      built = gen.plan;
      cozeUsed = gen.cozeUsed;
    } else {
      built = { ...buildStudyPlan(config), source: 'template' };
    }
    const plan = syncStageProgress({ _id: 'local_plan', _openid: 'local', ...built });
    storage.setStudyPlan(plan);
    return { plan, cozeUsed };
  },

  async listStudyTasks() {
    const plan = storage.getStudyPlan();
    const synced = plan ? syncStageProgress(plan) : null;
    const tasks = (synced && synced.tasks) || [];
    return { tasks: tasks.map(mapTaskForClient) };
  },

  async updateStudyTask(data) {
    const plan = storage.getStudyPlan();
    if (!plan || !plan.tasks) throw new Error('暂无备考计划');
    const tid = data.taskId || data.id;
    const idx = plan.tasks.findIndex(
      (t) => t.taskId === tid || String(t.taskId) === String(tid)
    );
    if (idx < 0) throw new Error('任务不存在');
    plan.tasks[idx].status = toBackendStatus(data.status);
    const synced = syncStageProgress({ ...plan, updatedAt: Date.now() });
    storage.setStudyPlan(synced);
    return { task: mapTaskForClient(synced.tasks[idx], idx) };
  },

  async addStudyTask(data) {
    const now = Date.now();
    const newTask = {
      taskId: 't_' + now,
      content: (data.name || '').trim(),
      type: data.type || '自定义',
      stage: '自定义',
      status: 'pending',
      deadline:
        data.deadline || new Date(now + 7 * 86400000).toISOString().slice(0, 10),
      createdAt: now
    };
    if (!newTask.content) throw new Error('任务名称不能为空');
    let plan = storage.getStudyPlan();
    if (!plan) {
      const built = buildStudyPlan({
        direction: '考研英语',
        school: '目标院校',
        days: 180,
        studyHours: 4,
        weakness: []
      });
      plan = { _id: 'local_plan', ...built, tasks: [newTask] };
    } else {
      plan.tasks = plan.tasks || [];
      plan.tasks.push(newTask);
      plan.updatedAt = now;
    }
    storage.setStudyPlan(plan);
    return { task: mapTaskForClient(newTask, plan.tasks.length - 1) };
  },

  async submitEssayReview(data) {
    const content = (data.essayContent || '').trim();
    if (!content) throw new Error('作文内容不能为空');
    if (content.length > MAX_ESSAY_LEN) {
      throw new Error('作文内容不能超过 ' + MAX_ESSAY_LEN + ' 字');
    }
    let cozeAnswer = data.cozeAnswer || '';
    if (!cozeAnswer && data.useCoze !== false) {
      try {
        const user = storage.getUser();
        const prompt = buildEssayCozePrompt(content, data.essayType, data.topic);
        const coze = await askCoze(prompt, { user });
        cozeAnswer = coze.content || '';
      } catch (e) {
        console.warn('essay coze', e);
      }
    }
    const reviewResult = buildEssayReviewResult(content, cozeAnswer, data.essayType, data.topic);
    const review = storage.addEssayReview({
      essayContent: content,
      essayType: data.essayType,
      topic: data.topic,
      reviewResult
    });
    return { review, reviewResult };
  },

  async listEssayReviews(data) {
    const list = storage.getEssayReviews().slice(0, data.limit || 10);
    return { list };
  },

  async adminLogin(data) {
    if (checkAdminCredentials(data.username, data.password)) {
      const token = createAdminToken();
      storage.setAdminToken(token);
      return { token, message: '登录成功' };
    }
    throw new Error('账号或密码错误');
  },

  async getAdminStats(data) {
    const token = (data && data.adminToken) || storage.getAdminToken();
    if (!validateAdminToken(token)) {
      throw new Error('未授权，请重新登录管理后台');
    }
    return storage.getAdminStatsLocal();
  },

  async seedUniversities() {
    return { message: '本地模式无需导入云库', count: catalog.UNIVERSITIES.length };
  }
};

async function api(action, data = {}) {
  if (useCloud()) {
    const payload = { ...data };
    if (action === 'getAdminStats' && !payload.adminToken) {
      payload.adminToken = storage.getAdminToken();
    }
    return callCloud(action, payload);
  }
  if (!localApi[action]) {
    throw new Error('未知接口: ' + action);
  }
  return localApi[action](data);
}

module.exports = { api, useCloud };
