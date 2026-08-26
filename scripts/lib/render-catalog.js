function jsString(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function renderCatalog({ directions, universities, meta }) {
  const header = `/**
 * 院校基础数据（与设计说明书 universities 集合、UI 原型一致）
 * 参考书目、招生信息依据各校公开招生目录与考研论坛资料整理
 * 自动生成 — 请勿手改。编辑 data/source/*.json 后运行 npm run build
 * 版本: ${meta.version} | 更新: ${meta.updatedAt}
 */`;

  const body = `
const DIRECTIONS = ${jsString(directions)};

const UNIVERSITY_RAW = ${jsString(universities)};

const UNIVERSITIES = UNIVERSITY_RAW.map((u) => {
  const ids = Array.isArray(u.directionIds) && u.directionIds.length
    ? u.directionIds
    : DIRECTIONS.map((d) => d.directionId);
  return {
    ...u,
    examTypes: ['阅读理解', '翻译与写作', '完形填空', '专业课综合'],
    directions: ids
      .map((id) => DIRECTIONS.find((d) => d.directionId === id))
      .filter(Boolean)
      .map((d) => ({ directionId: d.directionId, directionName: d.directionName }))
  };
});

function listDirections() {
  return DIRECTIONS.slice();
}

function getDirection(directionId) {
  return DIRECTIONS.find((d) => d.directionId === directionId) || null;
}

function listUniversities(directionId) {
  if (!directionId) return UNIVERSITIES.slice();
  return UNIVERSITIES.filter((u) =>
    u.directions.some((d) => d.directionId === directionId)
  );
}

function getUniversity(universityId) {
  return UNIVERSITIES.find((u) => u._id === universityId) || null;
}

function profileFromSelection(directionId, universityId) {
  const d = getDirection(directionId);
  const u = getUniversity(universityId);
  return {
    directionId: directionId || '',
    direction: d ? d.directionName : '',
    universityId: universityId || '',
    targetSchool: u ? u.name : ''
  };
}

module.exports = {
  DIRECTIONS,
  UNIVERSITIES,
  listDirections,
  getDirection,
  listUniversities,
  getUniversity,
  profileFromSelection
};
`;

  return header + body;
}

module.exports = { renderCatalog };
