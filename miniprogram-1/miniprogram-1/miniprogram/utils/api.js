const storage = require('./storage.js');
const catalog = require('./catalog.js');

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
    return { plan: storage.getStudyPlan ? storage.getStudyPlan() : null };
  }
};

async function api(action, data = {}) {
  if (useCloud()) {
    return callCloud(action, data);
  }
  if (!localApi[action]) {
    throw new Error('未知接口: ' + action);
  }
  return localApi[action](data);
}

module.exports = { api, useCloud };
