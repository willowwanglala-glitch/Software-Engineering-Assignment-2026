#!/usr/bin/env node
/**
 * 检查 exam-topics.json 与 essay-samples.json 的覆盖情况
 * 列出尚未编写范文的真题题型
 */
const fs = require('fs');
const path = require('path');
const { SOURCE_DIR } = require('./lib/paths');

const topics = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'exam-topics.json'), 'utf8'));
const samples = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'essay-samples.json'), 'utf8'));

const coveredTopics = new Set(samples.map((s) => s.topic));
const missing = topics.filter((t) => !coveredTopics.has(t.topic));

console.log('真题题型总数:', topics.length);
console.log('已有范文   :', samples.length);
console.log('已覆盖 topic:', coveredTopics.size);

if (missing.length) {
  console.log('\n尚未编写范文的题型:');
  missing.forEach((t) => {
    console.log(' -', t.year, t.topic, '|', t.titleHint);
  });
  process.exitCode = 0;
} else {
  console.log('\n全部题型均已覆盖 ✓');
}

// 输出可粘贴到 essay-samples.json 的草稿模板
if (missing.length && process.argv.includes('--draft')) {
  const drafts = missing.map((t, i) => ({
    _id: 'es_draft_' + String(i + 1).padStart(3, '0'),
    year: t.year,
    examType: t.examType,
    essayType: t.essayType,
    topic: t.topic,
    title: t.titleHint,
    prompt: 'TODO: 填写题目要求',
    content: 'TODO: 填写原创参考范文',
    wordCount: 0,
    tags: t.tags,
    source: '依据' + t.year + '真题题型原创参考范文'
  }));
  const out = path.join(SOURCE_DIR, 'essay-samples.draft.json');
  fs.writeFileSync(out, JSON.stringify(drafts, null, 2) + '\n', 'utf8');
  console.log('\n草稿已写入', out);
}
