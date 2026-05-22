const cloud = require('wx-server-sdk');

async function callCozeChat({ question, userId, userProfile, conversationId }) {
  const res = await cloud.callFunction({
    name: 'cozeChat',
    data: { question, userId, userProfile, conversationId }
  });
  const result = res.result || {};
  if (!result.success) {
    throw new Error(result.error || 'Coze 调用失败');
  }
  return result;
}

module.exports = { callCozeChat };
