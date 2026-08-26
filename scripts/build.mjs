#!/usr/bin/env node
/**
 * 校验 data/source JSON 并生成 catalog.js / seedData.js
 * 用法: node scripts/build.mjs
 */
const fs = require('fs');
const { loadSources } = require('./lib/load-sources');
const { validateAll } = require('./lib/validate');
const { renderCatalog } = require('./lib/render-catalog');
const { renderSeedData } = require('./lib/render-seedData');
const { CATALOG_TARGETS, SEED_TARGETS, EXPORT_DIR } = require('./lib/paths');

function writeTargets(targets, content) {
  targets.forEach((file) => {
    fs.mkdirSync(require('path').dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    console.log('生成', file);
  });
}

function main() {
  const data = loadSources();
  validateAll(data);
  console.log('校验通过 ✓');

  const catalogJs = renderCatalog(data);
  const seedJs = renderSeedData(data);

  writeTargets(CATALOG_TARGETS, catalogJs);
  writeTargets(SEED_TARGETS, seedJs);

  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.writeFileSync(
    require('path').join(EXPORT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        version: data.meta.version,
        counts: {
          directions: data.directions.length,
          universities: data.universities.length,
          faqs: data.faqs.length,
          essaySamples: data.essaySamples.length
        }
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('\n构建完成:');
  console.log('  院校', data.universities.length);
  console.log('  FAQ ', data.faqs.length);
  console.log('  范文', data.essaySamples.length);
}

main();
