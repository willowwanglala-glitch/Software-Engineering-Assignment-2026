const { parseJsonFromCoze } = require('./cozeParse');
const { buildStudyPlan } = require('./planBuilder');

function uid() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function normalizePlanFromCoze(json, config) {
  if (!json || !Array.isArray(json.stages) || !json.stages.length) return null;

  const now = Date.now();
  const stages = [];
  const tasks = [];

  json.stages.forEach((s, si) => {
    const name = s.name || `阶段${si + 1}`;
    const taskTexts = Array.isArray(s.tasks) ? s.tasks.map(String) : [];
    const stageTaskStrings = [];
    taskTexts.forEach((text) => {
      const task = {
        taskId: uid(),
        content: text,
        stage: name,
        type: text.slice(0, 2),
        status: 'pending',
        deadline: new Date(now + (si + 1) * 14 * 86400000).toISOString().slice(0, 10),
        createdAt: now
      };
      tasks.push(task);
      stageTaskStrings.push(text);
    });
    stages.push({
      name,
      dayRange: s.dayRange || '',
      progress: 0,
      tasks: stageTaskStrings,
      weeklyGoal: s.weeklyGoal || '',
      materials: Array.isArray(s.materials) ? s.materials.map(String) : []
    });
  });

  return {
    planContent: json.planContent || buildStudyPlan(config).planContent,
    stages,
    tasks,
    config,
    createdAt: now,
    updatedAt: now,
    source: 'coze'
  };
}

function buildPlanCozePrompt(config, userProfile) {
  const school = config.school || config.targetSchool || '目标院校';
  const direction = config.direction || '考研英语';
  const days = config.days || 180;
  const hours = config.studyHours || 4;
  const weakness = (config.weakness || []).join('、') || '综合提升';

  let profile = '';
  if (userProfile) {
    profile = `考生画像：方向 ${userProfile.direction || direction}；院校 ${userProfile.targetSchool || school}；水平 ${userProfile.level || 3}/6；每日 ${userProfile.dailyHours || hours} 小时。\n`;
  }

  return (
    profile +
    `请为【${school} · ${direction}】制定 ${days} 天考研英语备考计划，每日约 ${hours} 小时，薄弱项：${weakness}。\n` +
    '必须只输出一个 JSON 对象，不要 markdown 说明，格式如下：\n' +
    '{"planContent":"概述","stages":[{"name":"基础阶段","dayRange":"第1-60天","tasks":["任务1"],"weeklyGoal":"目标","materials":["资料"]}]}\n' +
    'stages 恰好 3 个：基础阶段、强化阶段、冲刺阶段；每个阶段 tasks 至少 3 条。'
  );
}

async function generatePlanWithCoze({ config, userProfile, callCoze }) {
  const prompt = buildPlanCozePrompt(config, userProfile);
  try {
    const coze = await callCoze({
      question: prompt,
      userId: 'plan_gen',
      userProfile,
      conversationId: ''
    });
    const json = parseJsonFromCoze(coze.content || '');
    const normalized = normalizePlanFromCoze(json, config);
    if (normalized) return { plan: normalized, cozeUsed: true };
  } catch (e) {
    console.warn('Coze plan fallback:', e.message);
  }
  const built = buildStudyPlan(config);
  return { plan: { ...built, source: 'template' }, cozeUsed: false };
}

module.exports = { generatePlanWithCoze, normalizePlanFromCoze, buildPlanCozePrompt };
