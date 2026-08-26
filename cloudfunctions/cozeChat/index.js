const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COZE_CONFIG = require('./config');

/** 规范化 Authorization：去掉 BOM/零宽字符/多余 Bearer/引号/空白 */
function normalizeAuthHeader(raw) {
  let t = String(raw || '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/^["'“”‘’]|["'“”‘’]$/g, '');
  t = t.replace(/^Bearer\s+/i, '').trim();
  t = t.replace(/^Bearer\s+/i, '').trim();
  t = t.replace(/\s+/g, '');
  if (!t) return '';
  return 'Bearer ' + t;
}

function httpsGetJson(path, authHeader) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.coze.cn',
        path,
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            reject(new Error('Coze 返回非 JSON: ' + raw.slice(0, 200)));
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Coze 探测超时'));
    });
    req.on('error', reject);
    req.end();
  });
}

function postChat(body, authHeader) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.coze.cn',
        path: '/open_api/v2/chat',
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 55000
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            reject(new Error('Coze 返回非 JSON: ' + raw.slice(0, 200)));
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Coze 请求超时，请稍后重试或简化问题'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function parseAnswer(res) {
  const body = res.data;
  if (res.statusCode !== 200) {
    throw new Error(body?.msg || `HTTP ${res.statusCode}`);
  }
  if (body.code !== 0 && body.code !== undefined) {
    throw new Error(body.msg || `Coze 错误码 ${body.code}`);
  }
  const payload = body.data || body;
  const messages = payload.messages || [];
  const answer =
    messages.find((m) => m.type === 'answer') ||
    messages.find((m) => m.role === 'assistant') ||
    messages[messages.length - 1];
  return {
    content: answer ? answer.content || '' : '暂无回答',
    conversationId: payload.conversation_id || ''
  };
}

function buildProfilePrefix(profile) {
  if (!profile) return '';
  const direction = (profile.direction || '').trim();
  const school = (profile.targetSchool || '').trim();
  if (!direction && !school) {
    return '【备考画像】尚未设置目标方向与院校，请先给出通用考研英语建议。\n\n';
  }
  const parts = [];
  if (direction) parts.push('目标方向：' + direction);
  if (school) parts.push('目标院校：' + school);
  if (profile.level) parts.push('自评水平：' + profile.level + '/6');
  if (profile.dailyHours) parts.push('每日学习：约' + profile.dailyHours + '小时');
  return (
    '【备考画像】' +
    parts.join('；') +
    '。请结合以上背景回答，只讨论考研英语备考，勿偏离主题。\n\n【用户问题】'
  );
}

exports.main = async (event) => {
  event = event || {};

  if (event.action === 'debugAuth') {
    const authHeader = normalizeAuthHeader(COZE_CONFIG.token);
    const raw = String(COZE_CONFIG.token || '');
    const pat = authHeader.replace(/^Bearer\s+/i, '');
    return {
      success: true,
      debug: {
        hasConfig: !!COZE_CONFIG,
        rawLen: raw.length,
        authLen: authHeader.length,
        patLen: pat.length,
        startsWithPat: pat.indexOf('pat_') === 0,
        botIdLen: String(COZE_CONFIG.botId || '').trim().length,
        botIdTail: String(COZE_CONFIG.botId || '').trim().slice(-4),
        patHead: pat.slice(0, 8),
        patTail: pat.slice(-4),
        tip: '改完 config.js 必须重新「上传并部署」后，patTail 才会变'
      }
    };
  }

  if (event.action === 'debugPing') {
    const authHeader = normalizeAuthHeader(COZE_CONFIG.token);
    const botId = String(COZE_CONFIG.botId || '').trim();
    if (!authHeader || !botId) {
      return { success: false, error: 'config.js 缺少 token 或 botId' };
    }
    try {
      const res = await httpsGetJson(
        '/v1/bot/get_online_info?bot_id=' + encodeURIComponent(botId),
        authHeader
      );
      const code = res.data && res.data.code;
      const msg = (res.data && res.data.msg) || '';
      if (code === 0) {
        const bot = (res.data && res.data.data) || {};
        return {
          success: true,
          message: 'Token 鉴权成功，可访问该 Bot',
          botName: bot.name || bot.bot_name || '',
          botIdTail: botId.slice(-4)
        };
      }
      return {
        success: false,
        error: msg || 'Coze 返回 code=' + code,
        httpStatus: res.statusCode,
        hint:
          /Bearer|token|4100|authentication/i.test(msg)
            ? 'PAT 无效：请在扣子新建「有效」令牌，写入 config.js 后重新部署 cozeChat'
            : /4101|permission|权限/i.test(msg)
              ? 'PAT 无权限：创建令牌时勾选 Bot/对话相关权限，并授权对应工作空间'
              : '请核对 botId 是否为该 Bot 的发布 ID，且 Bot 已发布'
      };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }

  const question = (event.question || '').trim();
  if (!question) {
    return { success: false, error: '问题不能为空' };
  }
  const authHeader = normalizeAuthHeader(COZE_CONFIG.token);
  const botId = String(COZE_CONFIG.botId || '').trim();
  if (!authHeader || !botId) {
    return { success: false, error: '请配置 cloudfunctions/cozeChat/config.js 的 token 与 botId' };
  }
  if (authHeader.length < 40) {
    return {
      success: false,
      error: 'Bearer token 过短，可能复制不完整。请到 Coze 重新创建 Personal Access Token 后整段粘贴'
    };
  }

  const query = buildProfilePrefix(event.userProfile) + question;

  try {
    const body = {
      bot_id: botId,
      user: event.userId || 'mp_user',
      query,
      stream: false
    };
    if (event.conversationId) {
      body.conversation_id = event.conversationId;
    }
    const res = await postChat(body, authHeader);
    const parsed = parseAnswer(res);
    if (!parsed.content) {
      return {
        success: false,
        error: 'Coze 未返回正文，请确认 Bot 已发布且 Token 有权限'
      };
    }
    return { success: true, ...parsed };
  } catch (e) {
    console.error('cozeChat error', e);
    return { success: false, error: e.message || String(e) };
  }
};
