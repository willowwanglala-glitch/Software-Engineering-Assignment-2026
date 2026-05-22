Page({
  data: {
    name: '',
    city: '',
    tags: [],
    feature: '',
    description: '',
    books: [
      { name: '高级英语（修订本）', author: '张汉熙' },
      { name: '英美文学选读', author: '吴伟仁' },
      { name: '英语语言学教程', author: '胡壮麟' }
    ],
    featureDetail: ''
  },

  onLoad(options) {
    const name = decodeURIComponent(options.name || '')
    const city = decodeURIComponent(options.city || '')
    const tagsStr = decodeURIComponent(options.tags || '')
    const feature = decodeURIComponent(options.feature || '')
    const tags = tagsStr ? tagsStr.split(',') : []

    this.setData({
      name: name,
      city: city,
      tags: tags,
      feature: feature,
      description: name + '是国内知名高等院校，在英语语言文学及相关学科领域具有深厚的学术积淀和优秀的师资力量。该校注重培养学生的语言运用能力和学术研究能力，毕业生在就业和深造方面均有良好表现。',
      featureDetail: name + '在外国语言文学学科方面具有显著优势，拥有雄厚的师资力量和丰富的学术资源。学校注重理论与实践相结合，为学生提供多样化的学习平台和国际交流机会，是英语考研学子的理想选择。'
    })
  },

  onSelect() {
    wx.setStorageSync('selectedSchool', {
      name: this.data.name,
      city: this.data.city,
      tags: this.data.tags,
      feature: this.data.feature
    })
    wx.showToast({ title: '已选择该院校', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  goBack() {
    wx.navigateBack()
  }
})
