let contact = { teamName: 'Language for Life', contactEmail: '请配置 contact.js' };
try {
  contact = require('../config/contact.js');
} catch (e) {
  /* 复制 contact.example.js */
}

module.exports = contact;
