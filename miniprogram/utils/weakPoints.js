/**
 * 从 AI 答疑问题中抽取备考薄弱点，并生成推荐练习任务。
 * 规则匹配即可演示闭环，无需再调一次大模型。
 */

const CATALOG = [
  {
    id: 'reading',
    name: '阅读理解',
    keywords: ['阅读', '推理题', '主旨', '细节题', '长难句', '新题型', '七选五', '排序题', '正确率'],
    task: '精读 1 篇近十年真题阅读并复盘错题类型',
    type: '阅读'
  },
  {
    id: 'writing',
    name: '写作',
    keywords: ['作文', '写作', '小作文', '大作文', '模板', '书信', '图表作文', '图画作文'],
    task: '按近期话题写 1 篇作文（可配合作文批改）',
    type: '写作'
  },
  {
    id: 'translation',
    name: '翻译',
    keywords: ['翻译', '英译汉', '汉译英', '译句', '翻译腔'],
    task: '精译 3–5 句真题翻译并对照参考译文',
    type: '翻译'
  },
  {
    id: 'cloze',
    name: '完形填空',
    keywords: ['完形', '完型', '填空'],
    task: '限时完成 1 篇真题完形并总结搭配',
    type: '完形'
  },
  {
    id: 'vocab',
    name: '词汇',
    keywords: ['单词', '词汇', '背单词', '熟词僻义', '词义'],
    task: '复习 50–80 个高频词并做语境造句',
    type: '词汇'
  },
  {
    id: 'school',
    name: '院校专业课',
    keywords: ['院校', '择校', '复试', '专业课', '二外', 'MTI', '报录比', '调剂'],
    task: '查阅目标院校近 3 年专业课书目与真题回忆',
    type: '院校'
  }
];

function extractFromText(text) {
  const raw = String(text || '');
  if (!raw.trim()) return [];
  const hit = [];
  CATALOG.forEach((item) => {
    let score = 0;
    item.keywords.forEach((kw) => {
      if (raw.indexOf(kw) !== -1) score += 1;
    });
    if (score > 0) {
      hit.push({
        id: item.id,
        name: item.name,
        score,
        task: item.task,
        type: item.type
      });
    }
  });
  hit.sort((a, b) => b.score - a.score);
  return hit;
}

/** 合并历史薄弱点，按频次累计，最多保留 5 个 */
function mergeWeakPoints(existing, incoming) {
  const map = {};
  (existing || []).forEach((w) => {
    if (!w || !w.id) return;
    map[w.id] = {
      id: w.id,
      name: w.name || w.id,
      count: Number(w.count) || 1,
      task: w.task || '',
      type: w.type || '',
      updatedAt: w.updatedAt || Date.now()
    };
  });
  const now = Date.now();
  (incoming || []).forEach((w) => {
    if (!w || !w.id) return;
    if (!map[w.id]) {
      map[w.id] = {
        id: w.id,
        name: w.name,
        count: 1,
        task: w.task || '',
        type: w.type || '',
        updatedAt: now
      };
    } else {
      map[w.id].count += 1;
      map[w.id].updatedAt = now;
      if (w.task) map[w.id].task = w.task;
    }
  });
  return Object.keys(map)
    .map((k) => map[k])
    .sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt)
    .slice(0, 5);
}

function buildTaskName(weak) {
  if (!weak) return '';
  return '【薄弱点·' + (weak.name || '') + '】' + (weak.task || '专项练习');
}

function findCatalog(id) {
  return CATALOG.find((c) => c.id === id) || null;
}

module.exports = {
  CATALOG,
  extractFromText,
  mergeWeakPoints,
  buildTaskName,
  findCatalog
};
