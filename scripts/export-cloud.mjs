#!/usr/bin/env node
/**
 * 导出云数据库可导入的 JSON 包（控制台 → 导入）
 */
const fs = require('fs');
const path = require('path');
const { loadSources } = require('./lib/load-sources');
const { validateAll } = require('./lib/validate');
const { EXPORT_DIR } = require('./lib/paths');

function withTimestamp(docs) {
  const now = Date.now();
  return docs.map((doc) => ({ ...doc, createdAt: now }));
}

function main() {
  const data = loadSources();
  validateAll(data);

  const outDir = path.join(EXPORT_DIR, 'cloud-import');
  fs.mkdirSync(outDir, { recursive: true });

  const dirMap = Object.fromEntries(
    data.directions.map((d) => [d.directionId, d.directionName])
  );

  const universities = data.universities.map((u) => {
    const ids =
      Array.isArray(u.directionIds) && u.directionIds.length
        ? u.directionIds
        : data.directions.map((d) => d.directionId);
    return {
      ...u,
      examTypes: ['阅读理解', '翻译与写作', '完形填空', '专业课综合'],
      directions: ids
        .filter((id) => dirMap[id])
        .map((id) => ({ directionId: id, directionName: dirMap[id] }))
    };
  });

  const bundles = [
    ['universities.json', withTimestamp(universities)],
    ['faqs.json', withTimestamp(data.faqs)],
    ['essay_samples.json', withTimestamp(data.essaySamples)]
  ];

  // 云控制台要求 JSON Lines：每行一条对象
  bundles.forEach(([name, docs]) => {
    const file = path.join(outDir, name);
    const body = docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n';
    fs.writeFileSync(file, body, 'utf8');
    console.log('导出', file, '—', docs.length, '条 (JSON Lines)');
  });

  const readme = `# 云数据库导入包

生成时间: ${new Date().toISOString()}
数据版本: ${data.meta.version}

## 使用方式

1. 微信云开发控制台 → 数据库 → 对应集合
2. 点击「导入」→ 选择本目录 JSON 文件（**JSON Lines 格式**）
3. 冲突模式选 Insert；文件编码 UTF-8

## 文件

- universities.json → 集合 universities (${universities.length} 条)
- faqs.json → 集合 faqs (${data.faqs.length} 条)
- essay_samples.json → 集合 essay_samples (${data.essaySamples.length} 条)
`;
  fs.writeFileSync(path.join(outDir, 'README.md'), readme, 'utf8');
  console.log('\n完成 →', outDir);
}

main();
