#!/usr/bin/env node
/**
 * 从现有 catalog.js / seedData.js 反向导出 JSON 源文件（一次性迁移或备份用）
 * 用法: node scripts/extract-sources.mjs
 */
const fs = require('fs');
const path = require('path');
const { SOURCE_DIR } = require('./lib/paths');

const catalog = require('../cloudfunctions/backendApi/catalog');
const seed = require('../cloudfunctions/backendApi/seedData');

fs.mkdirSync(SOURCE_DIR, { recursive: true });

const universities = catalog.UNIVERSITIES.map((u) => {
  const { directions, examTypes, ...rest } = u;
  return rest;
});

const files = [
  ['directions.json', catalog.DIRECTIONS],
  ['universities.json', universities],
  ['faqs.json', seed.FAQS],
  ['essay-samples.json', seed.ESSAY_SAMPLES]
];

files.forEach(([name, data]) => {
  const file = path.join(SOURCE_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('写入', name, '—', Array.isArray(data) ? data.length + ' 条' : 'ok');
});

console.log('\n完成。请编辑 data/source/ 后运行 npm run build');
