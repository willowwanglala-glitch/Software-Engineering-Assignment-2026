Page({
  data: {
    filter: 'all',
    tasks: [],
    filteredTasks: [],
    progressPercent: 0,
    progressDeg: 0
  },

  onLoad() {
    this.loadTasks();
  },

  onShow() {
    this.loadTasks();
  },

  loadTasks() {
    let tasks = wx.getStorageSync('progressTasks');
    if (!tasks || tasks.length === 0) {
      tasks = [
        { id: 1, name: '背诵核心词汇500词', type: '词汇', deadline: '2024-03-15', status: 'done' },
        { id: 2, name: '完成2010-2015年阅读真题', type: '阅读', deadline: '2024-04-01', status: 'doing' },
        { id: 3, name: '积累写作模板10篇', type: '写作', deadline: '2024-04-15', status: 'todo' },
        { id: 4, name: '翻译专项训练50句', type: '翻译', deadline: '2024-05-01', status: 'todo' },
        { id: 5, name: '完形填空真题精练', type: '完形', deadline: '2024-05-15', status: 'doing' }
      ];
      wx.setStorageSync('progressTasks', tasks);
    }
    this.setData({ tasks: tasks });
    this.applyFilter();
    this.calcProgress();
  },

  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter });
    this.applyFilter();
  },

  applyFilter() {
    const filter = this.data.filter;
    const tasks = this.data.tasks;
    let filtered = tasks;
    if (filter !== 'all') {
      filtered = tasks.filter(t => t.status === filter);
    }
    this.setData({ filteredTasks: filtered });
  },

  toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const tasks = this.data.tasks;
    const statusOrder = ['todo', 'doing', 'done'];
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        const idx = statusOrder.indexOf(tasks[i].status);
        tasks[i].status = statusOrder[(idx + 1) % 3];
        break;
      }
    }
    wx.setStorageSync('progressTasks', tasks);
    this.setData({ tasks: tasks });
    this.applyFilter();
    this.calcProgress();
  },

  addTask() {
    wx.showModal({
      title: '添加新任务',
      editable: true,
      placeholderText: '请输入任务名称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const tasks = this.data.tasks;
          const maxId = tasks.reduce((max, t) => t.id > max ? t.id : max, 0);
          const now = new Date();
          const deadline = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '-' + (now.getDate() + 7 < 10 ? '0' : '') + (now.getDate() + 7);
          tasks.push({
            id: maxId + 1,
            name: res.content.trim(),
            type: '自定义',
            deadline: deadline,
            status: 'todo'
          });
          wx.setStorageSync('progressTasks', tasks);
          this.setData({ tasks: tasks });
          this.applyFilter();
          this.calcProgress();
          wx.showToast({ title: '添加成功', icon: 'success' });
        }
      }
    });
  },

  calcProgress() {
    const tasks = this.data.tasks;
    if (tasks.length === 0) {
      this.setData({ progressPercent: 0, progressDeg: 0 });
      return;
    }
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const percent = Math.round((doneCount / tasks.length) * 100);
    const deg = (percent / 100) * 360;
    this.setData({ progressPercent: percent, progressDeg: deg });
  }
});