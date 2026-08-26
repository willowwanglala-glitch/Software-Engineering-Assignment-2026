const { api } = require('../../utils/api.js');

Page({
  data: {
    sample: null,
    showCopyPanel: false,
    copyPanelText: '',
    copyPanelFocus: false,
    copySelStart: -1,
    copySelEnd: -1
  },

  noop() {},

  async onLoad(options) {
    const sampleId = options.id || '';
    if (!sampleId) return;
    wx.showLoading({ title: '加载中' });
    try {
      const res = await api('getEssaySample', { sampleId });
      wx.hideLoading();
      const sample = res.sample || {};
      this.setData({
        sample: {
          ...sample,
          examLabel: sample.examType === 'english1' ? '英语一' : '英语二',
          typeLabel: sample.essayType === 'big' ? '大作文' : '小作文'
        }
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  goReview() {
    const topic = (this.data.sample && this.data.sample.topic) || '';
    wx.navigateTo({
      url: '/pages/essay-review/essay-review?topic=' + encodeURIComponent(topic)
    });
  },

  getSampleContent() {
    return ((this.data.sample && this.data.sample.content) || '').trim();
  },

  focusSelectAll(content) {
    const len = (content || '').length;
    // 先失焦再聚焦，确保 selection-start/end 生效
    this.setData({
      copyPanelFocus: false,
      copySelStart: -1,
      copySelEnd: -1
    });
    setTimeout(() => {
      this.setData({
        copyPanelFocus: true,
        copySelStart: 0,
        copySelEnd: len
      });
    }, 80);
  },

  openCopyPanel(content, tip) {
    this.setData({
      showCopyPanel: true,
      copyPanelText: content,
      copyPanelFocus: false,
      copySelStart: -1,
      copySelEnd: -1
    });
    this.focusSelectAll(content);
    if (tip) {
      wx.showToast({ title: tip, icon: 'none', duration: 2800 });
    }
  },

  closeCopyPanel() {
    this.setData({
      showCopyPanel: false,
      copyPanelFocus: false,
      copySelStart: -1,
      copySelEnd: -1
    });
  },

  onCopyPanelFocus() {
    const len = (this.data.copyPanelText || '').length;
    if (len > 0 && this.data.copySelEnd !== len) {
      this.setData({ copySelStart: 0, copySelEnd: len });
    }
  },

  selectAllInPanel() {
    const content = this.data.copyPanelText || this.getSampleContent();
    if (!content) return;
    this.focusSelectAll(content);
    this.writeClipboard(content, true);
  },

  writeClipboard(content, fromPanel) {
    wx.setClipboardData({
      data: content,
      success: () => {
        if (fromPanel) this.closeCopyPanel();
        wx.showToast({ title: '已复制', icon: 'success' });
      },
      fail: (err) => {
        const msg = String((err && (err.errMsg || err.message)) || '');
        console.warn('[copy] setClipboardData fail', err);
        if (/not declared|未声明|privacy agreement/i.test(msg)) {
          if (!fromPanel) {
            this.openCopyPanel(
              content,
              '后台剪切板声明可能未生效，请在弹层中全选复制'
            );
          } else {
            this.focusSelectAll(content);
            wx.showToast({
              title: '请长按文本「全选」再「复制」',
              icon: 'none',
              duration: 2800
            });
          }
          return;
        }
        if (/auth|隐私|authorize|deny|拒绝/i.test(msg)) {
          if (!fromPanel) {
            this.openCopyPanel(content, '请先同意隐私弹窗，或在弹层中全选复制');
          } else {
            this.focusSelectAll(content);
            wx.showToast({
              title: '请长按文本「全选」再「复制」',
              icon: 'none',
              duration: 2800
            });
          }
          return;
        }
        if (!fromPanel) {
          this.openCopyPanel(content, '复制失败，请在弹层中全选复制');
        } else {
          this.focusSelectAll(content);
          wx.showToast({
            title: '请长按文本「全选」再「复制」',
            icon: 'none',
            duration: 2800
          });
        }
      }
    });
  },

  /** 先确保隐私授权，再写入剪贴板 */
  ensurePrivacyThenCopy(content) {
    const run = () => this.writeClipboard(content, false);

    if (!wx.getPrivacySetting) {
      run();
      return;
    }

    wx.getPrivacySetting({
      success: (res) => {
        if (res && res.needAuthorization && wx.requirePrivacyAuthorize) {
          wx.requirePrivacyAuthorize({
            success: run,
            fail: () => {
              this.openCopyPanel(content, '需先同意隐私保护指引，或在弹层中全选复制');
            }
          });
          return;
        }
        run();
      },
      fail: run
    });
  },

  copyContent() {
    const content = this.getSampleContent();
    if (!content) {
      wx.showToast({ title: '暂无可复制内容', icon: 'none' });
      return;
    }
    this.ensurePrivacyThenCopy(content);
  },

  goBack() {
    wx.navigateBack();
  }
});
