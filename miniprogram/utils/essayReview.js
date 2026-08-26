const { parseJsonFromCoze } = require('./cozeParse.js');

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function countWords(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  const words = t.match(/[A-Za-z]+(?:['\-][A-Za-z]+)*/g);
  return words ? words.length : 0;
}

function maxScoreByWordCount(words, essayType) {
  const isSmall = essayType === 'small';
  if (words <= 0) return 0;
  if (words < 5) return 2;
  if (words < 15) return 4;
  if (words < 40) return 6;
  if (words < 80) return isSmall ? 10 : 9;
  if (words < 120) return isSmall ? 14 : 12;
  if (words < 150) return isSmall ? 17 : 14;
  if (words < 180) return isSmall ? 19 : 16;
  return 20;
}

function ruleScoreByWords(words, essayType) {
  const cap = maxScoreByWordCount(words, essayType);
  if (cap <= 0) return 0;
  if (words < 40) return clamp(Math.round(words * 0.35), 1, cap);
  if (words < 80) return clamp(Math.round(5 + words / 20), 4, cap);
  if (words < 150) return clamp(Math.round(8 + words / 25), 7, cap);
  return clamp(Math.round(12 + (words - 150) / 40), 11, cap);
}

function dimensionBaseFromWords(words) {
  if (words < 15) return 25;
  if (words < 40) return 40;
  if (words < 80) return 55;
  if (words < 150) return 68;
  return clamp(72 + (words - 150) / 20, 72, 88);
}

function applyLengthGuards(score, words, essayType, suggestions) {
  const capped = Math.min(score, maxScoreByWordCount(words, essayType));
  const out = { ...suggestions };
  out.error = Array.isArray(out.error) ? out.error.slice() : [];
  out.warning = Array.isArray(out.warning) ? out.warning.slice() : [];
  out.success = Array.isArray(out.success) ? out.success.slice() : [];
  const need = essayType === 'small' ? 80 : 150;
  if (words < 15) {
    out.error.unshift(
      '篇幅严重不足（约 ' +
        words +
        ' 词）。考研英语' +
        (essayType === 'small' ? '小作文一般不少于约 80 词' : '大作文一般不少于约 150 词') +
        '，当前内容无法按完整作文评分。'
    );
  } else if (words < need) {
    out.warning.unshift(
      '篇幅偏短（约 ' + words + ' 词，建议不少于约 ' + need + ' 词），已按词数限制评分上限。'
    );
  }
  return { score: clamp(Math.round(capped), 0, 20), suggestions: out };
}

function defaultDimensions(base) {
  return [
    { name: '词汇', value: clamp(Math.round(base + 3), 20, 95) },
    { name: '语法', value: clamp(Math.round(base - 5), 20, 90) },
    { name: '结构', value: clamp(Math.round(base + 5), 20, 95) },
    { name: '内容', value: clamp(Math.round(base - 2), 20, 90) },
    { name: '逻辑', value: clamp(Math.round(base + 1), 20, 92) }
  ];
}

function buildEssayReviewFromJson(json, essayContent, essayType, topic, rawFeedback) {
  const words = countWords(essayContent);
  let score = clamp(Math.round(Number(json.score) || 0), 0, 20);
  if (score > 0 && score <= 15 && Number(json.score) <= 15 && words >= 80) {
    score = clamp(Math.round((score / 15) * 20), 0, 20);
  }
  const dimensions = Array.isArray(json.dimensions)
    ? json.dimensions.map((d) => ({
        name: d.name || '维度',
        value: clamp(Math.round(d.value || 50), 10, 100)
      }))
    : defaultDimensions(dimensionBaseFromWords(words));
  const sug = json.suggestions || {};
  let suggestions = {
    error: Array.isArray(sug.error) ? sug.error.map(String) : [],
    warning: Array.isArray(sug.warning) ? sug.warning.map(String) : [],
    success: Array.isArray(sug.success) ? sug.success.map(String) : []
  };
  const guarded = applyLengthGuards(score, words, essayType, suggestions);
  if (words < 40) {
    return {
      score: guarded.score,
      wordCount: words,
      dimensions: defaultDimensions(dimensionBaseFromWords(words)),
      suggestions: guarded.suggestions,
      reference: json.reference || '',
      rawFeedback: rawFeedback || '',
      topic: topic || '',
      essayType: essayType || 'big',
      source: 'coze_json'
    };
  }
  return {
    score: guarded.score,
    wordCount: words,
    dimensions: dimensions.length ? dimensions : defaultDimensions(dimensionBaseFromWords(words)),
    suggestions: guarded.suggestions,
    reference: json.reference || '',
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
  const words = countWords(essayContent);
  const score = ruleScoreByWords(words, essayType);
  const dimensions = defaultDimensions(dimensionBaseFromWords(words));
  const suggestions = { error: [], warning: [], success: [] };
  const text = (cozeAnswer || '').trim();
  if (text) {
    const lines = text
      .split(/\n+/)
      .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);
    lines.forEach((line) => {
      if (/错误|问题|修改|应改|不足/i.test(line)) suggestions.error.push(line);
      else if (/优点|亮点|清晰/i.test(line)) suggestions.success.push(line);
      else if (line.length > 4) suggestions.warning.push(line);
    });
    if (!suggestions.error.length && !suggestions.warning.length && lines.length) {
      suggestions.warning = lines.slice(0, 6);
    }
  }
  if (!suggestions.success.length && words >= 80) {
    suggestions.success.push('文章已具备基本篇幅，可继续优化论证与用词。');
  }
  const guarded = applyLengthGuards(score, words, essayType, suggestions);
  return {
    score: guarded.score,
    wordCount: words,
    dimensions,
    suggestions: guarded.suggestions,
    reference:
      'As is vividly depicted in the picture, persistence leads to success in postgraduate preparation.',
    rawFeedback: text,
    topic: topic || '',
    essayType: essayType || 'big',
    source: 'rule'
  };
}

function buildEssayCozePrompt(essayContent, essayType, topic) {
  const typeLabel = essayType === 'small' ? '小作文' : '大作文';
  const words = countWords(essayContent);
  const need = essayType === 'small' ? 80 : 150;
  return (
    `请批改以下考研英语${typeLabel}（题目：${topic || '未命名'}）。\n` +
    `作文约 ${words} 个英文单词（系统统计）。完整${typeLabel}一般不少于约 ${need} 词。\n` +
    '只输出一个 JSON 对象：{"score":12,"dimensions":[{"name":"词汇","value":70}],"suggestions":{"error":[],"warning":[],"success":[]},"reference":"..."}\n' +
    'score 为 0-20 分；词数明显不足时必须给低分（少于 15 词不超过 4 分）。\n' +
    '作文正文：\n' +
    essayContent
  );
}

module.exports = {
  countWords,
  buildEssayReviewResult,
  buildEssayCozePrompt
};
