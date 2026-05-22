Page({
  data: {
    messages: [
      { role: 'ai', content: '你好！我是你的考研英语助手。有什么我可以帮你的吗？' }
    ],
    inputText: '',
    scrollToId: '',
    suggestions: ['考研英语一题型', '翻译技巧', '作文模板', '阅读策略', '完形填空', '长难句'],
    replyMap: {
      '题型': '考研英语一题型包括：完形填空（10分）、阅读理解（40分）、新题型（10分）、翻译（10分）、小作文（10分）、大作文（20分）。建议按阅读>作文>翻译>完形的顺序备考。',
      '翻译': '翻译技巧：1.先通读全文理解大意；2.划分句子结构，找出主谓宾；3.注意词性转换和语序调整；4.专有名词要准确翻译；5.最后通读译文确保流畅。推荐每天练习1-2个长难句翻译。',
      '作文': '作文模板建议：大作文（图画作文）三段式：描述图画→分析原因→总结建议。小作文（书信）注意格式和语域。推荐积累20个高级句型和50个核心词汇，每周至少写2篇完整作文。',
      '阅读': '阅读策略：1.先看题干，带着问题读文章；2.注意首尾段和转折词；3.定位关键信息，对比选项；4.排除法很有效，注意偷换概念和过度推断；5.每天精读1篇真题，分析出题思路。',
      '完形': '完形填空技巧：1.先通读全文把握大意；2.利用上下文逻辑关系（因果、转折、并列）；3.注意固定搭配和词义辨析；4.先做有把握的题，最后再猜；5.完形填空考查的是语感和逻辑，多读多练。',
      '长难句': '长难句分析方法：1.找谓语动词，确定句子主干；2.识别从句（定语从句、状语从句、名词性从句）；3.注意非谓语动词短语；4.分析修饰关系；5.重新组织语序翻译。建议每天分析3-5个长难句，坚持一个月会有明显提升。'
    }
  },

  onLoad() {
    this.scrollToBottom();
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendSuggestion(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ inputText: text });
    this.sendMessage();
  },

  sendMessage() {
    const text = this.data.inputText.trim();
    if (!text) return;

    const messages = this.data.messages.concat({ role: 'user', content: text });
    this.setData({ messages: messages, inputText: '' });
    this.scrollToBottom();

    // 模拟AI回复
    setTimeout(() => {
      const reply = this.getReply(text);
      const newMessages = this.data.messages.concat({ role: 'ai', content: reply });
      this.setData({ messages: newMessages });
      this.scrollToBottom();
    }, 800);
  },

  getReply(text) {
    const map = this.data.replyMap;
    for (var key in map) {
      if (text.indexOf(key) !== -1) {
        return map[key];
      }
    }
    return '这是一个很好的问题！关于"' + text + '"，建议你参考考研英语大纲和历年真题进行针对性复习。如果需要更详细的解答，可以尝试更具体地描述你的问题。';
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollToId: 'msg-bottom' });
    }, 100);
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});