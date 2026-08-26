const { api } = require('../../utils/api.js');

Page({
  data: {
    filter: 'all',
    tasks: [],
    filteredTasks: [],
    progressPercent: 0,
    progressDeg: 0,
    loading: false
  },

  onShow() {
    this.loadTasks();
  },

  async loadTasks() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await api('listStudyTasks');
      const tasks = res.tasks || [];
      this.setData({ tasks });
      this.applyFilter();
      this.calcProgress();
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
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
      filtered = tasks.filter((t) => t.status === filter);
    }
    this.setData({ filteredTasks: filtered });
  },

  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const tasks = this.data.tasks;
    const statusOrder = ['todo', 'doing', 'done'];
    let nextStatus = 'todo';
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id || String(tasks[i].id) === String(id)) {
        const idx = statusOrder.indexOf(tasks[i].status);
        nextStatus = statusOrder[(idx + 1) % 3];
        break;
      }
    }
    try {
      await api('updateStudyTask', { id, status: nextStatus });
      await this.loadTasks();
    } catch (err) {
      wx.showToast({ title: err.message || '更新失败', icon: 'none' });
    }
  },

  addTask() {
    wx.showModal({
      title: '添加新任务',
      editable: true,
      placeholderText: '请输入任务名称',
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const now = new Date();
          const m = now.getMonth() + 1;
          const d = now.getDate() + 7;
          const deadline =
            now.getFullYear() +
            '-' +
            (m < 10 ? '0' : '') +
            m +
            '-' +
            (d < 10 ? '0' : '') +
            d;
          try {
            await api('addStudyTask', { name: res.content.trim(), deadline });
            await this.loadTasks();
            wx.showToast({ title: '添加成功', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: err.message || '添加失败', icon: 'none' });
          }
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
    const doneCount = tasks.filter((t) => t.status === 'done').length;
    const percent = Math.round((doneCount / tasks.length) * 100);
    const deg = (percent / 100) * 360;
    this.setData({ progressPercent: percent, progressDeg: deg });
  }
});
