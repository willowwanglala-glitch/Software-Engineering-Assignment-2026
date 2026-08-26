const catalog = require('../../utils/catalog.js');
const { getLocalUser, setLocalUser } = require('../../utils/auth.js');
const { api } = require('../../utils/api.js');

Page({
  data: {
    directionList: [],
    schoolList: [],
    directions: [],
    schools: [],
    directionIndex: -1,
    schoolIndex: -1,
    days: 180,
    studyHours: 4,
    weakness1: false,
    weakness2: false,
    weakness3: false,
    weakness4: false,
    weakness5: false,
    profileHint: '',
    fromProfile: false
  },

  onLoad() {
    const directionList = catalog.listDirections();
    const schoolList = catalog.listUniversities();
    this.setData({
      directionList,
      schoolList,
      directions: directionList.map((d) => d.directionName),
      schools: schoolList.map((s) => s.name)
    });
    this.prefillFromProfile();
    this.prefillWeaknessFromQa();
  },

  /** 用选校/画像已选方向与院校预填，避免再选一遍 */
  prefillFromProfile() {
    const user = getLocalUser();
    if (!user) return;

    const patch = {};
    if (user.dailyHours) {
      const h = Number(user.dailyHours) || 4;
      patch.studyHours = [2, 4, 6, 8].includes(h) ? h : h >= 8 ? 8 : h >= 6 ? 6 : h >= 4 ? 4 : 2;
    }

    let directionIndex = -1;
    if (user.directionId) {
      directionIndex = this.data.directionList.findIndex(
        (d) => d.directionId === user.directionId
      );
    }
    if (directionIndex < 0 && user.direction) {
      directionIndex = this.data.directionList.findIndex(
        (d) => d.directionName === user.direction
      );
    }

    if (directionIndex >= 0) {
      const directionId = this.data.directionList[directionIndex].directionId;
      const schoolList = catalog.listUniversities(directionId);
      let schoolIndex = -1;
      if (user.universityId) {
        schoolIndex = schoolList.findIndex((s) => s._id === user.universityId);
      }
      if (schoolIndex < 0 && (user.targetSchool || user.school)) {
        const name = user.targetSchool || user.school;
        schoolIndex = schoolList.findIndex((s) => s.name === name);
      }
      patch.directionIndex = directionIndex;
      patch.schoolList = schoolList;
      patch.schools = schoolList.map((s) => s.name);
      patch.schoolIndex = schoolIndex;
      patch.fromProfile = true;
      patch.profileHint =
        schoolIndex >= 0
          ? '已按你在「院校方向」中的选择预填，可修改；生成计划后会同步到备考画像。'
          : '已预填考研方向；请确认目标院校。';
    }

    if (Object.keys(patch).length) this.setData(patch);
  },

  /** 用 AI 答疑累计的薄弱点预勾选计划配置 */
  prefillWeaknessFromQa() {
    const user = getLocalUser();
    const points = (user && user.weakPoints) || [];
    if (!points.length) return;
    const names = points.map((p) => p.name || '');
    const patch = {};
    if (names.some((n) => n.indexOf('词汇') !== -1)) patch.weakness1 = true;
    if (names.some((n) => n.indexOf('阅读') !== -1)) patch.weakness2 = true;
    if (names.some((n) => n.indexOf('写作') !== -1)) patch.weakness3 = true;
    if (names.some((n) => n.indexOf('翻译') !== -1)) patch.weakness4 = true;
    if (names.some((n) => n.indexOf('完形') !== -1)) patch.weakness5 = true;
    if (Object.keys(patch).length) this.setData(patch);
  },

  onDirectionChange(e) {
    const directionIndex = parseInt(e.detail.value, 10);
    const directionId = this.data.directionList[directionIndex].directionId;
    const schoolList = catalog.listUniversities(directionId);
    const user = getLocalUser() || {};
    let schoolIndex = -1;
    if (user.universityId) {
      schoolIndex = schoolList.findIndex((s) => s._id === user.universityId);
    }
    if (schoolIndex < 0 && user.targetSchool) {
      schoolIndex = schoolList.findIndex((s) => s.name === user.targetSchool);
    }
    this.setData({
      directionIndex,
      schoolIndex,
      schoolList,
      schools: schoolList.map((s) => s.name),
      profileHint: '修改后生成计划将同步到备考画像。'
    });
  },

  onSchoolChange(e) {
    this.setData({
      schoolIndex: parseInt(e.detail.value, 10),
      profileHint: '修改后生成计划将同步到备考画像。'
    });
  },

  onDaysInput(e) {
    this.setData({ days: parseInt(e.detail.value, 10) || 0 });
  },

  decreaseDays() {
    if (this.data.days > 30) {
      this.setData({ days: this.data.days - 10 });
    }
  },

  increaseDays() {
    this.setData({ days: this.data.days + 10 });
  },

  selectHours(e) {
    const hours = parseInt(e.currentTarget.dataset.hours, 10);
    this.setData({ studyHours: hours });
  },

  toggleWeakness(e) {
    const index = e.currentTarget.dataset.index;
    const key = 'weakness' + index;
    this.setData({ [key]: !this.data[key] });
  },

  getWeaknessArray() {
    const result = [];
    if (this.data.weakness1) result.push('词汇');
    if (this.data.weakness2) result.push('阅读');
    if (this.data.weakness3) result.push('写作');
    if (this.data.weakness4) result.push('翻译');
    if (this.data.weakness5) result.push('完形');
    return result;
  },

  async syncProfileIfChanged(dir, school) {
    const user = getLocalUser() || {};
    const same =
      user.directionId === dir.directionId &&
      user.universityId === school._id &&
      Number(user.dailyHours) === Number(this.data.studyHours);
    if (same) return;
    try {
      const res = await api('updateProfile', {
        directionId: dir.directionId,
        direction: dir.directionName,
        universityId: school._id,
        targetSchool: school.name,
        dailyHours: this.data.studyHours
      });
      setLocalUser({ ...(getLocalUser() || {}), ...(res.user || {}) });
    } catch (e) {
      // 本地仍写入，保证答疑画像与计划一致
      setLocalUser({
        ...user,
        directionId: dir.directionId,
        direction: dir.directionName,
        universityId: school._id,
        targetSchool: school.name,
        dailyHours: this.data.studyHours
      });
      console.warn('updateProfile from plan-setup', e);
    }
  },

  async onGenerate() {
    if (this.data.directionIndex === -1) {
      wx.showToast({ title: '请选择考研方向', icon: 'none' });
      return;
    }
    if (this.data.schoolIndex === -1) {
      wx.showToast({ title: '请选择目标院校', icon: 'none' });
      return;
    }
    const dir = this.data.directionList[this.data.directionIndex];
    const school = this.data.schoolList[this.data.schoolIndex];
    wx.showLoading({ title: '准备中...' });
    try {
      await this.syncProfileIfChanged(dir, school);
    } finally {
      wx.hideLoading();
    }
    wx.setStorageSync('planConfig', {
      directionId: dir.directionId,
      direction: dir.directionName,
      universityId: school._id,
      school: school.name,
      targetSchool: school.name,
      days: this.data.days,
      studyHours: this.data.studyHours,
      weakness: this.getWeaknessArray(),
      useCoze: true
    });
    wx.navigateTo({ url: '/pages/plan-generating/plan-generating' });
  },

  goBack() {
    wx.navigateBack();
  }
});
