const { parseJsonFromCoze } = require('./cozeParse');

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function buildEssayReviewFromJson(json, essayContent, essayType, topic, rawFeedback) {
  const len = (essayContent || '').length;
  const score = clamp(Math.round(json.score || 6 + len / 70), 6, 15);
  const dimensions = Array.isArray(json.dimensions)
    ? json.dimensions.map((d) => ({
        name: d.name || '维度',
        value: clamp(Math.round(d.value || 70), 40, 100)
      }))
    : [];

  const suggestions = {
    error: Array.isArray(json.suggestions?.error) ? json.suggestions.error.map(String) : [],
    warning: Array.isArray(json.suggestions?.warning) ? json.suggestions.warning.map(String) : [],
    success: Array.isArray(json.suggestions?.success) ? json.suggestions.success.map(String) : []
  };

  const reference = json.reference || '';

  return {
    score,
    dimensions: dimensions.length
      ? dimensions
      : [
          { name: '词汇', value: 75 },
          { name: '语法', value: 65 },
          { name: '结构', value: 80 },
          { name: '内容', value: 70 },
          { name: '逻辑', value: 75 }
        ],
    suggestions,
    reference,
    rawFeedback: rawFeedback || '',
    topic: topic || '',
    essayType: essayType || 'big',
    source: 'coze_json'
  };
}

function buildEssayReviewResult(essayContent, cozeAnswer, essayType, topic) {
  const json = parseJsonFromCoze(cozeAnswer || '');
  if (json && (json.score != null || json.dimensions)) {
    return buildEssayReviewFromJson(json, essayContent, essayType, topic, cozeAnswer);
  }

  const len = (essayContent || '').length;
  const score = clamp(Math.round(6 + len / 70), 6, 15);
  const base = clamp(45 + len / 12, 50, 92);

  const dimensions = [
    { name: '词汇', value: clamp(base + 5, 50, 95) },
    { name: '语法', value: clamp(base - 8, 45, 90) },
    { name: '结构', value: clamp(base + 10, 55, 95) },
    { name: '内容', value: clamp(base, 50, 90) },
    { name: '逻辑', value: clamp(base + 3, 50, 92) }
  ];

  const suggestions = { error: [], warning: [], success: [] };
  const text = (cozeAnswer || '').trim();

  if (text) {
    const lines = text.split(/\n+/).map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
    lines.forEach((line) => {
      if (/错误|问题|修改|应改|不一致|混淆/i.test(line)) {
        suggestions.error.push(line);
      } else if (/优点|亮点|清晰|合理|自然/i.test(line)) {
        suggestions.success.push(line);
      } else if (line.length > 4) {
        suggestions.warning.push(line);
      }
    });
    if (!suggestions.error.length && !suggestions.warning.length && lines.length) {
      suggestions.warning = lines.slice(0, 6);
    }
  }

  if (!suggestions.success.length) {
    suggestions.success.push(
      essayType === 'small' ? '短文结构完整，可继续打磨句式。' : '文章结构清晰，段落衔接基本合理。'
    );
  }
  if (!suggestions.warning.length && len < 120) {
    suggestions.warning.push('篇幅偏短，建议补充论证与例证以支撑观点。');
  }

  const reference =
    'As is vividly depicted in the picture, a young man sits at a desk piled with books, looking determined. ' +
    'Simple as the picture is, the meaning is profound: persistence leads to success in postgraduate preparation. ' +
    'To sum up, we should cultivate perseverance and face challenges with courage.';

  return {
    score,
    dimensions,
    suggestions,
    reference,
    rawFeedback: text,
    topic: topic || '',
    essayType: essayType || 'big',
    source: 'rule'
  };
}

function buildEssayCozePrompt(essayContent, essayType, topic) {
  const typeLabel = essayType === 'small' ? '小作文' : '大作文';
  return (
    `请批改以下考研英语${typeLabel}（题目：${topic}）。\n` +
    '只输出一个 JSON 对象，不要其他说明，格式：\n' +
    '{"score":13,"dimensions":[{"name":"词汇","value":75}],"suggestions":{"error":[],"warning":[],"success":[]},"reference":"参考范文片段"}\n' +
    'score 为 0-15 分；dimensions 含词汇/语法/结构/内容/逻辑五项。\n' +
    '作文正文：\n' +
    essayContent
  );
}

module.exports = {
  buildEssayReviewResult,
  buildEssayReviewFromJson,
  buildEssayCozePrompt
};
