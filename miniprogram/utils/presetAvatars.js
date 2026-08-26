/** 内置可选头像（本地静态资源，无需 AI / 云存储） */
const PRESET_AVATARS = [
  { id: 'notebook', name: '每日一练', src: '/images/avatars/avatar_notebook.jpg' },
  { id: 'lighthouse', name: '坚持', src: '/images/avatars/avatar_lighthouse.jpg' },
  { id: 'astronaut', name: '词汇宇航员', src: '/images/avatars/avatar_astronaut.jpg' },
  { id: 'bear', name: 'ABC小熊', src: '/images/avatars/avatar_bear.jpg' },
  { id: 'baozi', name: '考研包子', src: '/images/avatars/avatar_baozi.jpg' },
  { id: 'cat', name: '单词猫咪', src: '/images/avatars/avatar_cat.jpg' }
];

function listPresetAvatars() {
  return PRESET_AVATARS.slice();
}

function getPresetAvatar(id) {
  return PRESET_AVATARS.find((a) => a.id === id) || null;
}

module.exports = {
  PRESET_AVATARS,
  listPresetAvatars,
  getPresetAvatar
};
