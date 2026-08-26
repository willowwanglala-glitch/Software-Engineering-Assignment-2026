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
  const { ensureCloudInit } = require('./ensureCloud.js');
  if (!ensureCloudInit()) {
    return Promise.reject(new Error('云开发未初始化：请检查 config/cloud.js 的 envId，并重新编译'));
  }
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
          const detail =
            result.error ||
            result.errMsg ||
            (typeof result === 'string' ? result : '') ||
            '云函数 cozeChat 返回失败（请检查是否已部署，且 config.js 已配置 token/botId）';
          reject(new Error(detail));
        }
      },
      fail: (err) => {
        const { formatCloudCallError } = require('./cloudError.js');
        reject(new Error(formatCloudCallError(err, 'cozeChat')));
      }
    });
  });
}

/** 云与直连都不可用时的演示降级，保证答疑链路可继续 */
function askCozeOfflineFallback(question) {
  const q = String(question || '');
  let tip = '当前 AI 云服务暂不可用，已启用本地演示回答。';
  if (/写作|作文|模板/.test(q)) {
    tip +=
      '\n\n写作建议：①先搭框架（开头点题→分论点→结尾）；②准备 2–3 组万能句；③每周限时写 1 篇并对照范文改病句。';
  } else if (/阅读|推理|长难句/.test(q)) {
    tip +=
      '\n\n阅读建议：按题型复盘错因，每天精读 1 篇并总结干扰项类型，长难句先抓主干再补修饰。';
  } else if (/翻译/.test(q)) {
    tip += '\n\n翻译建议：先拆分意群，再对照参考译文记固定搭配，每天精译 3–5 句。';
  } else if (/完形|完型/.test(q)) {
    tip += '\n\n完形建议：先通读抓主旨，再填逻辑连接与固定搭配，做完按词性归类错题。';
  } else if (/单词|词汇/.test(q)) {
    tip += '\n\n词汇建议：高频词分主题记忆，结合例句与真题语境，避免只刷单词表。';
  } else {
    tip += '\n\n请稍后重试云函数，或在开发者工具中重新部署 cozeChat 并检查 Coze 配置。';
  }
  return { content: tip, conversationId: '' };
}

async function askCoze(question, conversationIdOrOptions = '') {
  const { filterUserInput, filterAiOutput } = require('./contentSafety.js');
  const { isProduction } = require('./appConfig.js');
  const { getCloudConfig } = require('./cloudConfig.js');
  const check = filterUserInput(question);
  if (!check.ok) {
    throw new Error(check.reason);
  }
  const options = normalizeOptions(conversationIdOrOptions);
  const cfg = getCloudConfig();
  const { ensureCloudInit } = require('./ensureCloud.js');
  // 调用前强制 init，避免真机调试出现 Cloud API isn't enabled
  const useCloudMode = ensureCloudInit();
  const canDirect = !!(DIRECT_CONFIG.token && DIRECT_CONFIG.botId);
  const allowFallback = !isProduction() || !!cfg.fallbackToLocal;
  // 有云环境时禁止前端直连：本地 coze.config.local.js 常为过期 Token，会误报 Bearer 不合法
  const allowDirect = canDirect && allowFallback && !useCloudMode;

  if (isProduction() && !useCloudMode && !allowDirect) {
    throw new Error('正式版请配置云开发，AI 请求需走 cozeChat 云函数');
  }

  let res;
  let lastErr = null;

  if (useCloudMode) {
    try {
      res = await askCozeCloud(check.text, options);
    } catch (e) {
      lastErr = e;
      console.warn('[Coze] 云函数 cozeChat 失败:', e.message);
    }
  } else if (allowDirect) {
    try {
      res = await askCozeDirect(check.text, options);
    } catch (e) {
      lastErr = e;
    }
  }

  if (!res && allowFallback) {
    console.warn('[Coze] 使用本地演示回答:', lastErr && lastErr.message);
    res = askCozeOfflineFallback(check.text);
    if (lastErr && lastErr.message) {
      res.content +=
        '\n\n【排查】' +
        String(lastErr.message).slice(0, 160) +
        '。云端测试若正常，请重新编译小程序；并清除缓存后重试。';
    }
  }
  if (!res) {
    throw lastErr || new Error('AI 调用失败，请检查 cozeChat 云函数或 Coze 配置');
  }

  return {
    ...res,
    content: filterAiOutput(res.content)
  };
}

module.exports = {
  askCoze,
  buildCozeQuery,
  buildProfilePrefix
};
