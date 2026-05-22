function uid() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function buildStudyPlan(config) {
  const days = Math.max(90, config.days || 180);
  const third = Math.floor(days / 3);
  const school = config.school || config.targetSchool || '目标院校';
  const direction = config.direction || '考研英语';
  const hours = config.studyHours || 4;
  const weakness = config.weakness || [];

  const stageDefs = [
    {
      name: '基础阶段',
      dayRange: `第1-${third}天`,
      progress: 0,
      taskTexts: [
        `每日背诵核心词汇（${hours}小时计划）`,
        '长难句拆解 5 句',
        '精读真题阅读 1 篇',
        weakness.includes('词汇') ? '词汇专项巩固 30 分钟' : '听力/input 输入 20 分钟'
      ],
      weeklyGoal: '完成 1 套真题阅读并复盘',
      materials: ['《考研英语词汇闪过》', '《长难句解密》']
    },
    {
      name: '强化阶段',
      dayRange: `第${third + 1}-${third * 2}天`,
      progress: 0,
      taskTexts: [
        '真题阅读 2 篇计时训练',
        '写作模板积累与仿写 1 篇',
        '翻译练习 3 句',
        weakness.includes('阅读') ? '阅读错题归类复盘' : '完形填空 1 篇'
      ],
      weeklyGoal: '完成 1 套完整真题（不含作文）',
      materials: ['《考研英语历年真题》', '《考研英语高分写作》']
    },
    {
      name: '冲刺阶段',
      dayRange: `第${third * 2 + 1}-${days}天`,
      progress: 0,
      taskTexts: [
        '全真模拟 1 套',
        '错题本复盘 30 分钟',
        '大作文限时写作 1 篇',
        weakness.includes('写作') ? '作文批改与改写' : '新题型专项 1 套'
      ],
      weeklyGoal: '3 套全真模拟 + 作文专项',
      materials: ['《考前预测》', '《冲刺密卷》']
    }
  ];

  const stages = [];
  const tasks = [];
  const now = Date.now();

  stageDefs.forEach((def, si) => {
    const stageTasks = def.taskTexts.map((text) => {
      const task = {
        taskId: uid(),
        content: text,
        stage: def.name,
        type: text.slice(0, 2),
        status: 'pending',
        deadline: new Date(now + (si + 1) * 14 * 86400000).toISOString().slice(0, 10),
        createdAt: now
      };
      tasks.push(task);
      return text;
    });
    stages.push({
      name: def.name,
      dayRange: def.dayRange,
      progress: def.progress,
      tasks: stageTasks,
      weeklyGoal: def.weeklyGoal,
      materials: def.materials
    });
  });

  const planContent =
    `【${school} · ${direction}】${days} 天备考计划\n` +
    `每日学习 ${hours} 小时；薄弱项：${weakness.length ? weakness.join('、') : '综合提升'}。\n` +
    `分基础、强化、冲刺三阶段，任务已同步至学习页。`;

  return {
    planContent,
    stages,
    tasks,
    config: { ...config, days, studyHours: hours },
    createdAt: now,
    updatedAt: now
  };
}

module.exports = { buildStudyPlan };
