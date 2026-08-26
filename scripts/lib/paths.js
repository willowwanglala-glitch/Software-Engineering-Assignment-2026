const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

module.exports = {
  ROOT,
  SOURCE_DIR: path.join(ROOT, 'data/source'),
  EXPORT_DIR: path.join(ROOT, 'data/export'),
  CATALOG_TARGETS: [
    path.join(ROOT, 'miniprogram/utils/catalog.js'),
    path.join(ROOT, 'cloudfunctions/backendApi/catalog.js')
  ],
  SEED_TARGETS: [
    path.join(ROOT, 'miniprogram/utils/seedData.js'),
    path.join(ROOT, 'cloudfunctions/backendApi/seedData.js')
  ]
};
