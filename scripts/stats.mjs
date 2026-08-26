#!/usr/bin/env node
const { loadSources } = require('./lib/load-sources');

const data = loadSources();
const faqCats = {};
data.faqs.forEach((f) => {
  faqCats[f.category] = (faqCats[f.category] || 0) + 1;
});

console.log('=== 英语考研宝 数据统计 ===');
console.log('版本:', data.meta.version, '| 更新:', data.meta.updatedAt);
console.log('');
console.log('院校库:', data.universities.length, '所');
console.log('  有招生数据:', data.universities.filter((u) => u.enrollment).length);
console.log('  有数据来源:', data.universities.filter((u) => u.dataSource).length);
console.log('');
console.log('FAQ:', data.faqs.length, '条');
Object.entries(faqCats).forEach(([cat, n]) => console.log('  ', cat + ':', n));
console.log('');
console.log('作文范文:', data.essaySamples.length, '篇');
['english1', 'english2'].forEach((t) => {
  ['big', 'small'].forEach((e) => {
    const n = data.essaySamples.filter((s) => s.examType === t && s.essayType === e).length;
    console.log('  ', t, e + ':', n);
  });
});
