const contact = require('../../utils/contact.js');

Page({
  data: {
    updatedAt: '2026-05-29',
    teamName: contact.teamName,
    contactEmail: contact.contactEmail
  },
  goBack() {
    wx.navigateBack();
  },
  openPrivacy() {
    wx.navigateTo({ url: '/pages/legal/privacy' });
  }
});
