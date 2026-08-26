const fs = require('fs');
const path = require('path');
const { SOURCE_DIR } = require('./paths');

function readJson(name) {
  const file = path.join(SOURCE_DIR, name);
  if (!fs.existsSync(file)) throw new Error('缺少数据文件: ' + file);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadSources() {
  return {
    meta: readJson('meta.json'),
    directions: readJson('directions.json'),
    universities: readJson('universities.json'),
    faqs: readJson('faqs.json'),
    essaySamples: readJson('essay-samples.json')
  };
}

module.exports = { loadSources, readJson };
