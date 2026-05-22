const api = require('./api.js').api;
const storage = require('./storage.js');

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
  if (app && app.globalData.user) return app.globalData.user;
  return storage.getUser();
}

function setLocalUser(user) {
  const app = getApp();
  if (app) app.globalData.user = user;
  storage.setUser(user);
}

function needOnboarding(user) {
  if (!user) return true;
  const hasDirection = !!(user.directionId || (user.direction || '').trim());
  const hasSchool = !!(user.universityId || (user.targetSchool || '').trim());
  return !hasDirection || !hasSchool;
}

module.exports = { loginWithProfile, getLocalUser, setLocalUser, needOnboarding };
