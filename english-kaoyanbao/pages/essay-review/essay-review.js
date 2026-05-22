Page({
  data: {
    topicList: ['2024英语一大作文', '2024英语二大作文', '2023英语一大作文', '2023英语二大作文'],
    topicIndex: 0,
    essayType: 'big',
    essayContent: '',
    showResult: false,
    starIndex: 3,
    reviewResult: {
      score: 13,
      dimensions: [
        { name: '词汇', value: 75 },
        { name: '语法', value: 60 },
        { name: '结构', value: 85 },
        { name: '内容', value: 70 },
        { name: '逻辑', value: 80 }
      ],
      suggestions: {
        error: [
          '第2段存在主谓不一致的问题，"The number of students are"应改为"The number of students is"。',
          '"effect"和"affect"使用混淆，注意区分名词和动词形式。'
        ],
        warning: [
          '建议使用更多高级词汇替换基础词汇，如用"significant"替换"big"。',
          '第3段论证不够充分，建议增加具体例证来支撑观点。'
        ],
        success: [
          '文章结构清晰，三段式布局合理。',
          '开头段能够准确描述图画内容，切入主题自然。'
        ]
      },
      reference: 'As is vividly depicted in the picture, a young man is sitting in front of a desk piled with books, looking determined and focused. The caption below reads "Persistence Leads to Success".\n\nSimple as the picture is, the meaning behind it is profound. In recent years, with the increasingly fierce competition in the job market, more and more college students choose to pursue postgraduate studies. However, the journey is never easy. Only those who persist through difficulties can ultimately achieve their goals.\n\nTo sum up, persistence is an indispensable quality for anyone striving for success. As college students, we should cultivate this quality from now on, facing challenges with courage and determination.'
    }
  },

  onTopicChange(e) {
    this.setData({ topicIndex: e.detail.value });
  },

  switchType(e) {
    this.setData({ essayType: e.currentTarget.dataset.type });
  },

  onEssayInput(e) {
    this.setData({ essayContent: e.detail.value });
  },

  submitEssay() {
    if (!this.data.essayContent.trim()) {
      wx.showToast({ title: '请输入作文内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '批改中...' });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ showResult: true });
      wx.showToast({ title: '批改完成', icon: 'success' });
    }, 1500);
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});