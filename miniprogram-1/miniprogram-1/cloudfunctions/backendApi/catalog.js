/**
 * 院校基础数据（与设计说明书 universities 集合、UI 原型一致）
 * Alpha：静态目录；云开发模式下可经 seedUniversities 写入数据库
 */

const DIRECTIONS = [
  { directionId: 'en_lit', directionName: '英语语言文学', icon: '📖' },
  { directionId: 'en_ling', directionName: '外国语言学及应用语言学', icon: '🔤' },
  { directionId: 'trans', directionName: '翻译学', icon: '🌐' },
  { directionId: 'teaching', directionName: '学科教学(英语)', icon: '🎓' },
  { directionId: 'comparative', directionName: '比较文学与世界文学', icon: '📚' },
  { directionId: 'translation', directionName: '英语笔译', icon: '✍️' }
];

const UNIVERSITIES = [
  { _id: 'u00', name: '北京外国语大学', region: '北京', types: ['211', '外语类'], tags: ['翻硕热门'], desc: '该校外应专业实力突出，翻硕就业率较高' },
  { _id: 'u01', name: '上海外国语大学', region: '上海', types: ['211', '外语类'], tags: ['高翻摇篮'], desc: '底蕴深厚，外语学科全国顶尖' },
  { _id: 'u02', name: '北京师范大学', region: '北京', types: ['985', '师范'], tags: ['师范强校'], desc: '教育学与英语结合的典范' },
  { _id: 'u03', name: '华东师范大学', region: '上海', types: ['985', '师范'], tags: ['学科教育'], desc: '师范类英语教育全国领先' },
  { _id: 'u04', name: '南京大学', region: '南京', types: ['985', '综合'], tags: ['综合名校'], desc: '学术氛围浓厚，文学研究见长' },
  { _id: 'u05', name: '复旦大学', region: '上海', types: ['985', '综合'], tags: ['学术前沿'], desc: '国际化程度高，跨学科研究强' },
  { _id: 'u06', name: '浙江大学', region: '杭州', types: ['985', '综合'], tags: ['创新强校'], desc: '跨文化交流与翻译研究特色鲜明' },
  { _id: 'u07', name: '北京大学', region: '北京', types: ['985', '综合'], tags: ['顶尖学府'], desc: '学术殿堂，英语文学研究权威' },
  { _id: 'u08', name: '清华大学', region: '北京', types: ['985', '综合'], tags: ['学术殿堂'], desc: '理工强校背景下的精品文科' },
  { _id: 'u09', name: '广东外语外贸大学', region: '广州', types: ['外语类'], tags: ['外语强校'], desc: '华南外语龙头，应用性极强' },
  { _id: 'u10', name: '四川大学', region: '成都', types: ['985', '综合'], tags: ['西南名校'], desc: '西南地区外语教学与研究中心' },
  { _id: 'u11', name: '武汉大学', region: '武汉', types: ['985', '综合'], tags: ['樱花名校'], desc: '综合实力强劲，翻译人才辈出' },
  { _id: 'u12', name: '厦门大学', region: '厦门', types: ['985', '综合'], tags: ['最美校园'], desc: '东南沿海学术重镇，商务英语特色' },
  { _id: 'u13', name: '中山大学', region: '广州', types: ['985', '综合'], tags: ['华南第一'], desc: '学科门类齐全，翻译硕士口碑佳' },
  { _id: 'u14', name: '西安外国语大学', region: '西安', types: ['外语类'], tags: ['西北外语'], desc: '西北外语重镇，口译特色明显' }
].map((u) => ({
  ...u,
  books: ['高级英语', '语言学教程', '英美文学选读'],
  examTypes: ['阅读理解', '翻译与写作', '完形填空'],
  directions: DIRECTIONS.map((d) => ({ directionId: d.directionId, directionName: d.directionName }))
}));

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
