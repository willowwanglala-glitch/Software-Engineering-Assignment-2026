const REQUIRED_UNIV = ['_id', 'name', 'region', 'types', 'tags', 'desc', 'books', 'directionIds'];
const REQUIRED_FAQ = ['_id', 'category', 'order', 'question', 'answer'];
const REQUIRED_ESSAY = ['_id', 'year', 'examType', 'essayType', 'topic', 'title', 'content'];

function countWords(text) {
  return String(text || '')
    .replace(/[^\w\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function assertUniqueIds(items, label) {
  const seen = new Set();
  const dup = [];
  items.forEach((item) => {
    if (seen.has(item._id)) dup.push(item._id);
    seen.add(item._id);
  });
  if (dup.length) throw new Error(`${label} 存在重复 _id: ${dup.join(', ')}`);
}

function validateDirections(directions) {
  if (!Array.isArray(directions) || !directions.length) {
    throw new Error('directions.json 不能为空');
  }
  directions.forEach((d) => {
    if (!d.directionId || !d.directionName) {
      throw new Error('direction 缺少 directionId / directionName');
    }
  });
}

function validateUniversities(universities, directions) {
  if (!Array.isArray(universities) || !universities.length) {
    throw new Error('universities.json 不能为空');
  }
  assertUniqueIds(universities, 'universities');
  const dirIds = new Set((directions || []).map((d) => d.directionId));
  universities.forEach((u) => {
    REQUIRED_UNIV.forEach((k) => {
      if (u[k] === undefined || u[k] === null || u[k] === '') {
        throw new Error(`院校 ${u._id || '?'} 缺少字段 ${k}`);
      }
    });
    if (!Array.isArray(u.books) || !u.books.length) {
      throw new Error(`院校 ${u._id} books 不能为空`);
    }
    if (!Array.isArray(u.directionIds) || !u.directionIds.length) {
      throw new Error(`院校 ${u._id} directionIds 不能为空`);
    }
    u.directionIds.forEach((id) => {
      if (!dirIds.has(id)) {
        throw new Error(`院校 ${u._id} directionIds 含未知方向: ${id}`);
      }
    });
  });
}

function validateFaqs(faqs) {
  if (!Array.isArray(faqs) || !faqs.length) throw new Error('faqs.json 不能为空');
  assertUniqueIds(faqs, 'faqs');
  faqs.forEach((f) => {
    REQUIRED_FAQ.forEach((k) => {
      if (f[k] === undefined || f[k] === null || f[k] === '') {
        throw new Error(`FAQ ${f._id || '?'} 缺少字段 ${k}`);
      }
    });
  });
}

function validateEssaySamples(samples) {
  if (!Array.isArray(samples) || !samples.length) {
    throw new Error('essay-samples.json 不能为空');
  }
  assertUniqueIds(samples, 'essay-samples');
  samples.forEach((s) => {
    REQUIRED_ESSAY.forEach((k) => {
      if (s[k] === undefined || s[k] === null || s[k] === '') {
        throw new Error(`范文 ${s._id || '?'} 缺少字段 ${k}`);
      }
    });
    if (!['english1', 'english2'].includes(s.examType)) {
      throw new Error(`范文 ${s._id} examType 无效`);
    }
    if (!['big', 'small'].includes(s.essayType)) {
      throw new Error(`范文 ${s._id} essayType 无效`);
    }
    const words = countWords(s.content);
    if (s.essayType === 'big' && s.examType === 'english1' && words < 150) {
      throw new Error(`范文 ${s._id} 英语一大作文建议 ≥150 词，当前 ${words}`);
    }
    if (s.essayType === 'big' && s.examType === 'english2' && words < 110) {
      throw new Error(`范文 ${s._id} 英语二大作文建议 ≥110 词，当前 ${words}`);
    }
    if (s.essayType === 'small' && words < 80) {
      throw new Error(`范文 ${s._id} 小作文建议 ≥80 词，当前 ${words}`);
    }
  });
}

function validateAll(data) {
  validateDirections(data.directions);
  validateUniversities(data.universities, data.directions);
  validateFaqs(data.faqs);
  validateEssaySamples(data.essaySamples);
  return true;
}

module.exports = {
  validateAll,
  validateDirections,
  validateUniversities,
  validateFaqs,
  validateEssaySamples
};
