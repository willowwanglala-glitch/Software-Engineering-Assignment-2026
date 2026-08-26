
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
