const PRIVACY_KEY = 'lfl_privacy_agreed_v1';
const PRIVACY_VERSION = '1.0.0';

function hasAgreedPrivacy() {
  const v = wx.getStorageSync(PRIVACY_KEY);
  return v === PRIVACY_VERSION;
}

function setAgreedPrivacy() {
  wx.setStorageSync(PRIVACY_KEY, PRIVACY_VERSION);
}

function clearAgreedPrivacy() {
  wx.removeStorageSync(PRIVACY_KEY);
}

module.exports = {
  PRIVACY_VERSION,
  hasAgreedPrivacy,
  setAgreedPrivacy,
  clearAgreedPrivacy
};
