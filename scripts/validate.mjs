#!/usr/bin/env node
const { loadSources } = require('./lib/load-sources');
const { validateAll } = require('./lib/validate');

try {
  const data = loadSources();
  validateAll(data);
  console.log('数据校验通过 ✓');
  console.log('  directions     :', data.directions.length);
  console.log('  universities   :', data.universities.length);
  console.log('  faqs           :', data.faqs.length);
  console.log('  essay-samples  :', data.essaySamples.length);
} catch (e) {
  console.error('校验失败:', e.message);
  process.exit(1);
}
