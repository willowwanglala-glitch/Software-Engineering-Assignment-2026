const storage = require('./storage.js');
const catalog = require('./catalog.js');
const seedData = require('./seedData.js');
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
const { formatCloudCallError } = require('./cloudError.js');
const {
  getCloudConfig,
  isCloudUnavailableError,
  markCloudFallback
} = require('./cloudConfig.js');
const {
  extractFromText,
  mergeWeakPoints,
  buildTaskName
} = require('./weakPoints.js');

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
  const { ensureCloudInit } = require('./ensureCloud.js');
  if (!wx.cloud) return false;
  const app = getApp();
  if (app && app.globalData && app.globalData.cloudFallback) {
    // 仍允许尝试 init；真正失败由 callCloud 处理
  }
  return ensureCloudInit();
}

const LONG_CLOUD_ACTIONS = {
  generateStudyPlan: 60000,
  submitEssayReview: 60000
};

function callCloud(action, data, options) {
  const { ensureCloudInit } = require('./ensureCloud.js');
  if (!ensureCloudInit()) {
    return Promise.reject(
      new Error('云开发未初始化：请检查 config/cloud.js 的 envId，并重新编译')
    );
  }
  const timeoutMs =
    (options && options.timeoutMs) || LONG_CLOUD_ACTIONS[action] || 15000;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          '云函数请求超时（' +
            Math.round(timeoutMs / 1000) +
            's）。若在生成 AI 计划/批改，请将 backendApi 超时调至 60s 后重新部署'
        )
      );
    }, timeoutMs);
    wx.cloud.callFunction({
      name: 'backendApi',
      data: { action, data },
      success: (res) => {
        clearTimeout(timer);
        const result = res.result || {};
        if (result.success) resolve(result);
        else reject(new Error(result.error || '请求失败'));
      },
      fail: (err) => {
        clearTimeout(timer);
        reject(new Error(formatCloudCallError(err, 'backendApi')));
      }
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
    const hits = extractFromText(data.question);
    const log = storage.addQaLog({
      question: data.question,
      answer: data.answer,
      conversationId: data.conversationId,
      weakTags: hits.map((h) => h.id)
    });

    let weakPoints = [];
    let suggestedTask = null;
    if (hits.length) {
      const app = getApp();
      const user = storage.getUser() || (app && app.globalData.user) || {};
      weakPoints = mergeWeakPoints(user.weakPoints || [], hits);
      user.weakPoints = weakPoints;
      storage.setUser(user);
      if (app) app.globalData.user = user;

      const marker = '【薄弱点·' + hits[0].name + '】';
      let plan = storage.getStudyPlan();
      const existing = ((plan && plan.tasks) || []).find(
        (t) =>
          (t.status === 'pending' || t.status === 'doing') &&
          String(t.content || '').indexOf(marker) !== -1
      );
      if (existing) {
        suggestedTask = mapTaskForClient(existing, 0);
      } else {
        const now = Date.now();
        const newTask = {
          taskId: 't_weak_' + now,
          content: buildTaskName(hits[0]),
          type: hits[0].type || '薄弱点',
          stage: '薄弱点强化',
          status: 'pending',
          deadline: new Date(now + 7 * 86400000).toISOString().slice(0, 10),
          createdAt: now,
          fromWeakPoint: hits[0].id
        };
        if (!plan) {
          const built = buildStudyPlan({
            direction: '考研英语',
            school: '目标院校',
            days: 180,
            studyHours: 4,
            weakness: [hits[0].name]
          });
          plan = { _id: 'local_plan', ...built, tasks: [newTask] };
        } else {
          plan.tasks = plan.tasks || [];
          plan.tasks.push(newTask);
          plan.updatedAt = now;
        }
        storage.setStudyPlan(plan);
        suggestedTask = mapTaskForClient(newTask, (plan.tasks || []).length - 1);
      }
    }

    return {
      log,
      weakPoints,
      hitTags: hits.map((h) => h.name),
      suggestedTask
    };
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
  },

  async seedContentData() {
    return {
      message: '本地模式使用内置数据',
      universities: { count: catalog.UNIVERSITIES.length },
      faqs: { count: seedData.FAQS.length },
      essaySamples: { count: seedData.ESSAY_SAMPLES.length }
    };
  },

  async listFaqs(data) {
    const list = seedData.listFaqs(data && data.category);
    return { list, categories: seedData.listFaqCategories() };
  },

  async getFaq(data) {
    const faq = seedData.getFaq(data.faqId);
    if (!faq) throw new Error('FAQ 不存在');
    return { faq };
  },

  async listEssaySamples(data) {
    return { list: seedData.listEssaySamples(data || {}) };
  },

  async getEssaySample(data) {
    const sample = seedData.getEssaySample(data.sampleId);
    if (!sample) throw new Error('范文不存在');
    return { sample };
  },

  async listEssayTopics() {
    return { topics: seedData.listEssayTopics() };
  },

  async submitFeedback(data) {
    const fb = storage.addFeedback({
      type: data.type,
      content: data.content,
      contact: data.contact,
      status: 'pending'
    });
    return { feedback: fb };
  }
};

async function api(action, data = {}) {
  if (useCloud()) {
    const payload = { ...data };
    if (action === 'getAdminStats' && !payload.adminToken) {
      payload.adminToken = storage.getAdminToken();
    }
    try {
      return await callCloud(action, payload);
    } catch (e) {
      const cfg = getCloudConfig();
      const msg = (e && e.message) || '';
      const canLocal = !!(cfg.fallbackToLocal && localApi[action]);
      // 超时 / 云不可用：优先本地或模板，避免计划页直接失败
      if (
        canLocal &&
        (isCloudUnavailableError(e) || /超时|timeout/i.test(msg))
      ) {
        console.warn('[api] 云调用失败，降级本地:', action, msg);
        // 仅环境/函数不存在时锁云；超时不要把整次会话的 AI 也切到前端旧 Token
        if (
          isCloudUnavailableError(e) &&
          !/超时|timeout|timed out/i.test(msg)
        ) {
          markCloudFallback(e.message);
        }
        return localApi[action](data);
      }
      // AI 计划：再试一次纯模板（不调 Coze），保证演示可出结果
      if (action === 'generateStudyPlan' && canLocal) {
        console.warn('[api] 计划生成降级模板:', msg);
        return localApi[action]({ ...data, useCoze: false });
      }
      throw e;
    }
  }
  if (!localApi[action]) {
    throw new Error('未知接口: ' + action);
  }
  return localApi[action](data);
}

module.exports = { api, useCloud };
