const api = require('./api.js').api;
const storage = require('./storage.js');
const catalog = require('./catalog.js');

function enrichUserProfile(user) {
  if (!user) return user;
  const u = { ...user };
  if (u.directionId && !u.direction) {
    const d = catalog.getDirection(u.directionId);
    if (d) u.direction = d.directionName;
  }
  if (u.universityId && !u.targetSchool) {
    const uni = catalog.getUniversity(u.universityId);
    if (uni) u.targetSchool = uni.name;
  }
  return u;
}

async function loginWithProfile(profile) {
  const nickName = profile.nickName || '微信用户';
  const avatarUrl = profile.avatarUrl || '';
  const res = await api('getOrCreateUser', { nickName, avatarUrl });
  const user = res.user;
  setLocalUser(user);
  return user;
}

function getLocalUser() {
  const app = getApp();
  const raw = (app && app.globalData.user) || storage.getUser();
  return enrichUserProfile(raw);
}

function setLocalUser(user) {
  const prev = getLocalUser();
  const enriched = enrichUserProfile(user || {});
  if (prev && prev.avatarUrl && !enriched.avatarUrl) {
    enriched.avatarUrl = prev.avatarUrl;
  }
  const app = getApp();
  if (app) app.globalData.user = enriched;
  storage.setUser(enriched);
  return enriched;
}

function needOnboarding(user) {
  if (!user) return true;
  const hasDirection = !!(user.directionId || (user.direction || '').trim());
  const hasSchool = !!(user.universityId || (user.targetSchool || '').trim());
  return !hasDirection || !hasSchool;
}

function wechatLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async () => {
        try {
          const user = await loginWithProfile({
            nickName: '微信用户',
            avatarUrl: ''
          });
          resolve(user);
        } catch (e) {
          reject(e);
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '微信登录失败'))
    });
  });
}

module.exports = {
  loginWithProfile,
  getLocalUser,
  setLocalUser,
  needOnboarding,
  wechatLogin,
  enrichUserProfile
};
