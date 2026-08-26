
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
