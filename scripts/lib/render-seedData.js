function jsString(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function renderSeedData({ faqs, essaySamples, meta }) {
  const header = `/**
 * 云数据库种子数据：FAQ、作文范文
 * 内容依据公开考研英语真题题型与常见备考资料整理（原创编写，非转载版权范文）
 * 自动生成 — 请勿手改。编辑 data/source/*.json 后运行 npm run build
 * 版本: ${meta.version} | 更新: ${meta.updatedAt}
 */`;

  const body = `
const FAQS = ${jsString(faqs)};

const ESSAY_SAMPLES = ${jsString(essaySamples)};

function listFaqs(category) {
  let list = FAQS.slice();
  if (category) list = list.filter((f) => f.category === category);
  return list.sort((a, b) => a.order - b.order);
}

function getFaq(faqId) {
  return FAQS.find((f) => f._id === faqId) || null;
}

function listFaqCategories() {
  const set = new Set(FAQS.map((f) => f.category));
  return Array.from(set);
}

function listEssaySamples(filters) {
  const { examType, essayType, year } = filters || {};
  let list = ESSAY_SAMPLES.slice();
  if (examType) list = list.filter((e) => e.examType === examType);
  if (essayType) list = list.filter((e) => e.essayType === essayType);
  if (year) list = list.filter((e) => e.year === year);
  return list.sort((a, b) => b.year - a.year);
}

function getEssaySample(sampleId) {
  return ESSAY_SAMPLES.find((e) => e._id === sampleId) || null;
}

function listEssayTopics() {
  return ESSAY_SAMPLES.map((e) => e.topic).filter((v, i, a) => a.indexOf(v) === i);
}

module.exports = {
  FAQS,
  ESSAY_SAMPLES,
  listFaqs,
  getFaq,
  listFaqCategories,
  listEssaySamples,
  getEssaySample,
  listEssayTopics
};
`;

  return header + body;
}

module.exports = { renderSeedData };
