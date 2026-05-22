function syncStageProgress(plan) {
  if (!plan || !plan.stages) return plan;
  const tasks = plan.tasks || [];
  plan.stages = plan.stages.map((stage) => {
    const related = tasks.filter((t) => t.stage === stage.name);
    const total = related.length;
    const done = related.filter((t) => t.status === 'completed' || t.status === 'done').length;
    const progress = total ? Math.round((done / total) * 100) : stage.progress || 0;
    return { ...stage, progress };
  });
  return plan;
}

module.exports = { syncStageProgress };
