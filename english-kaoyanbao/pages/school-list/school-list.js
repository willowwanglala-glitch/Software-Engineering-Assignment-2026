Page({
  data: {
    schools: [
      { name: '北京外国语大学', city: '北京', tags: ['211', '外语类'], feature: '外国语言文学A+' },
      { name: '上海外国语大学', city: '上海', tags: ['211', '外语类'], feature: '外国语言文学A+' },
      { name: '北京师范大学', city: '北京', tags: ['985', '211'], feature: '教育学A+' },
      { name: '华东师范大学', city: '上海', tags: ['985', '211'], feature: '教育学A' },
      { name: '南京大学', city: '南京', tags: ['985', '211'], feature: '外国语言文学A' },
      { name: '复旦大学', city: '上海', tags: ['985', '211'], feature: '外国语言文学A-' },
      { name: '浙江大学', city: '杭州', tags: ['985', '211'], feature: '外国语言文学A-' },
      { name: '北京大学', city: '北京', tags: ['985', '211'], feature: '外国语言文学A+' },
      { name: '清华大学', city: '北京', tags: ['985', '211'], feature: '外国语言文学A-' },
      { name: '广东外语外贸大学', city: '广州', tags: ['外语类'], feature: '翻译学特色' },
      { name: '四川大学', city: '成都', tags: ['985', '211'], feature: '外国语言文学B+' },
      { name: '武汉大学', city: '武汉', tags: ['985', '211'], feature: '外国语言文学B+' },
      { name: '厦门大学', city: '厦门', tags: ['985', '211'], feature: '外国语言文学B+' },
      { name: '中山大学', city: '广州', tags: ['985', '211'], feature: '外国语言文学B+' },
      { name: '西安外国语大学', city: '西安', tags: ['外语类'], feature: '翻译学特色' }
    ]
  },

  goDetail(e) {
    const index = e.currentTarget.dataset.index
    const school = this.data.schools[index]
    wx.navigateTo({
      url: '/pages/school-detail/school-detail?name=' + encodeURIComponent(school.name) + '&city=' + encodeURIComponent(school.city) + '&tags=' + encodeURIComponent(school.tags.join(',')) + '&feature=' + encodeURIComponent(school.feature)
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
