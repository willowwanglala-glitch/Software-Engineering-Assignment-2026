const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COZE_CONFIG = require('./config');

function postChat(body) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.coze.cn',
        path: '/open_api/v2/chat',
        method: 'POST',
        headers: {
          Authorization: COZE_CONFIG.token,
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
  const question = (event.question || '').trim();
  if (!question) {
    return { success: false, error: '问题不能为空' };
  }
  if (!COZE_CONFIG.token || !COZE_CONFIG.botId) {
    return { success: false, error: '请配置 cloudfunctions/cozeChat/config.js' };
  }

  const query = buildProfilePrefix(event.userProfile) + question;

  try {
    const res = await postChat({
      bot_id: COZE_CONFIG.botId,
      user: event.userId || 'mp_user',
      query,
      conversation_id: event.conversationId || '',
      stream: false
    });
    const parsed = parseAnswer(res);
    return { success: true, ...parsed };
  } catch (e) {
    console.error('cozeChat error', e);
    return { success: false, error: e.message || String(e) };
  }
};
