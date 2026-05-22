// Coze 调用：自动注入用户备考画像；云开发模式下走 cozeChat 云函数（Token 不下发前端）

let localConfig = null;
try {
  localConfig = require('./coze.config.local.js');
} catch (e) {
  localConfig = null;
}

const DIRECT_CONFIG = localConfig || {
  baseURL: 'https://api.coze.cn/open_api/v2/chat',
  token: '',
  botId: ''
};

function buildProfilePrefix(user) {
  if (!user) return '';
  const direction = (user.direction || '').trim();
  const school = (user.targetSchool || '').trim();
  if (!direction && !school) {
    return '【备考画像】尚未设置目标方向与院校，请先给出通用考研英语建议。\n\n';
  }
  const parts = [];
  if (direction) parts.push('目标方向：' + direction);
  if (school) parts.push('目标院校：' + school);
  if (user.level) parts.push('自评水平：' + user.level + '/6');
  if (user.dailyHours) parts.push('每日学习：约' + user.dailyHours + '小时');
  return (
    '【备考画像】' +
    parts.join('；') +
    '。请结合以上背景回答，只讨论考研英语备考，勿偏离主题。\n\n【用户问题】'
  );
}

function buildCozeQuery(question, user) {
  const q = (question || '').trim();
  return buildProfilePrefix(user) + q;
}

function getCozeUserId(user) {
  if (user && user._id) return 'mp_' + String(user._id);
  return 'mp_guest';
}

function parseCozeHttpResponse(res) {
  const body = res.data;
  if (!body || typeof body !== 'object') {
    throw new Error('Coze 返回数据异常');
  }
  if (res.statusCode !== 200) {
    throw new Error(body.msg || `HTTP ${res.statusCode}`);
  }
  if (body.code !== 0 && body.code !== undefined) {
    throw new Error(body.msg || `Coze 错误码 ${body.code}`);
  }
  const payload = body.data || body;
  const messages = payload.messages || [];
  const answer =
    messages.find((m) => m.type === 'answer') ||
    messages.find((m) => m.role === 'assistant' && m.type !== 'verbose') ||
    messages[0];
  return {
    content: answer && answer.content ? answer.content : '暂无回答',
    conversationId: payload.conversation_id || body.conversation_id || ''
  };
}

function normalizeOptions(conversationIdOrOptions) {
  if (typeof conversationIdOrOptions === 'string') {
    return { conversationId: conversationIdOrOptions, user: null };
  }
  if (conversationIdOrOptions && typeof conversationIdOrOptions === 'object') {
    return {
      conversationId: conversationIdOrOptions.conversationId || '',
      user: conversationIdOrOptions.user || null
    };
  }
  return { conversationId: '', user: null };
}

function askCozeDirect(question, options) {
  const { conversationId, user } = options;
  const query = buildCozeQuery(question, user);

  return new Promise((resolve, reject) => {
    if (!DIRECT_CONFIG.token || !DIRECT_CONFIG.botId) {
      reject(
        new Error(
          '请配置 Coze：复制 coze.config.example.js 为 coze.config.local.js 并填写 token、botId'
        )
      );
      return;
    }
    wx.request({
      url: DIRECT_CONFIG.baseURL,
      method: 'POST',
      timeout: 60000,
      header: {
        Authorization: DIRECT_CONFIG.token,
        'Content-Type': 'application/json'
      },
      data: {
        bot_id: DIRECT_CONFIG.botId,
        user: getCozeUserId(user),
        query,
        conversation_id: conversationId || undefined,
        stream: false
      },
      success: (res) => {
        try {
          resolve(parseCozeHttpResponse(res));
        } catch (e) {
          console.error('[Coze] 解析失败:', e);
          reject(e);
        }
      },
      fail: (err) => {
        console.error('[Coze] 请求失败:', err);
        const msg = err.errMsg || '';
        if (msg.includes('timeout')) {
          reject(
            new Error(
              '请求超时。请确认：详情→本地设置已勾选「不校验合法域名」；并尝试将基础库改为 3.5.x'
            )
          );
        } else if (msg.includes('domain') || msg.includes('合法')) {
          reject(new Error('域名受限：详情→本地设置→勾选「不校验合法域名」后重新编译'));
        } else {
          reject(new Error(msg || '网络请求失败'));
        }
      }
    });
  });
}

function askCozeCloud(question, options) {
  const { conversationId, user } = options;
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'cozeChat',
      data: {
        question,
        conversationId,
        userId: getCozeUserId(user),
        userProfile: user
          ? {
              direction: user.direction,
              targetSchool: user.targetSchool,
              level: user.level,
              dailyHours: user.dailyHours
            }
          : null
      },
      success: (res) => {
        const result = res.result || {};
        if (result.success) {
          resolve({
            content: result.content,
            conversationId: result.conversationId || ''
          });
        } else {
          reject(new Error(result.error || '云函数调用失败'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '云函数调用失败'))
    });
  });
}

function askCoze(question, conversationIdOrOptions = '') {
  const options = normalizeOptions(conversationIdOrOptions);
  const app = getApp();
  const useCloud =
    !!(app && app.globalData && app.globalData.env && wx.cloud);
  if (useCloud) {
    return askCozeCloud(question, options);
  }
  return askCozeDirect(question, options);
}

module.exports = {
  askCoze,
  buildCozeQuery,
  buildProfilePrefix
};
