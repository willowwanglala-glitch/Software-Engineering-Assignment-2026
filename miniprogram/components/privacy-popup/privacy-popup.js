let checked = false;

Component({
  data: {
    show: false,
    privacyContractName: '《隐私政策》'
  },

  lifetimes: {
    attached() {
      if (wx.onNeedPrivacyAuthorization) {
        wx.onNeedPrivacyAuthorization((resolve) => {
          this._privacyResolve = resolve;
          this.setData({ show: true });
        });
      }
      this.checkPrivacyOnce();
    }
  },

  methods: {
    checkPrivacyOnce() {
      if (checked || !wx.getPrivacySetting) return;
      wx.getPrivacySetting({
        success: (res) => {
          checked = true;
          if (res.needAuthorization) {
            this.setData({
              show: true,
              privacyContractName: res.privacyContractName || '《隐私政策》'
            });
          }
        },
        fail: () => {
          checked = true;
        }
      });
    },

    openPrivacy() {
      if (wx.openPrivacyContract) {
        wx.openPrivacyContract({
          fail: () => wx.navigateTo({ url: '/pages/legal/privacy' })
        });
      } else {
        wx.navigateTo({ url: '/pages/legal/privacy' });
      }
    },

    resolvePrivacyAgree() {
      if (this._privacyResolve) {
        this._privacyResolve({ buttonId: 'agree-privacy-btn', event: 'agree' });
        this._privacyResolve = null;
      }
    },

    resolvePrivacyDisagree() {
      if (this._privacyResolve) {
        this._privacyResolve({ event: 'disagree' });
        this._privacyResolve = null;
      }
    },

    handleDisagree() {
      this.resolvePrivacyDisagree();
      this.setData({ show: false });
      wx.showToast({ title: '需同意隐私政策后使用', icon: 'none' });
    },

    handleAgree(e) {
      checked = true;
      // 优先用事件回调里的 resolve；兼容 requirePrivacyAuthorize 等待中的情况
      this.resolvePrivacyAgree();
      this.setData({ show: false });
      if (e && e.detail) {
        // agreePrivacyAuthorization 成功后，后续敏感 API 才可调用
        console.log('[privacy] agreed', e.detail);
      }
    }
  }
});
