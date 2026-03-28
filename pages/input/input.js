// pages/input/input.js
Page({
  data: {
    // 城市列表
    cities: [],
    cityInput: '',
    // 日期
    today: '',
    startDate: '',
    endDate: '',
    // 出行人数
    travelers: 1,
    // 预算选项
    budget: '',
    budgetOptions: [
      { value: 'low', label: '经济型' },
      { value: 'medium', label: '舒适型' },
      { value: 'high', label: '豪华型' }
    ],
    // 偏好标签
    preferences: [
      { value: 'scenery', label: '自然风光', selected: false },
      { value: 'history', label: '历史文化', selected: false },
      { value: 'food', label: '美食探索', selected: false },
      { value: 'shopping', label: '购物娱乐', selected: false },
      { value: 'relax', label: '休闲度假', selected: false },
      { value: 'adventure', label: '户外探险', selected: false }
    ],
    // 是否可以提交
    canSubmit: false
  },

  onLoad: function() {
    // 设置今天日期为最小可选日期
    const today = this.formatDate(new Date());
    this.setData({ today });
  },

  // 格式化日期
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 城市输入
  onCityInput: function(e) {
    this.setData({
      cityInput: e.detail.value
    });
  },

  // 添加城市
  onAddCity: function() {
    const city = this.data.cityInput.trim();
    if (!city) return; // 空输入不处理
    
    if (this.data.cities.includes(city)) {
      wx.showToast({ title: '该城市已添加', icon: 'none' });
      this.setData({ cityInput: '' });
      return;
    }
    const cities = [...this.data.cities, city];
    this.setData({
      cities: cities,
      cityInput: ''
    });
    this.checkCanSubmit();
  },

  // 移除城市
  onRemoveCity: function(e) {
    const index = e.currentTarget.dataset.index;
    const cities = this.data.cities.filter((_, i) => i !== index);
    this.setData({ cities });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit: function() {
    const { cities, startDate, endDate } = this.data;
    const canSubmit = cities.length > 0 && startDate && endDate;
    this.setData({ canSubmit });
  },

  // 开始日期选择
  onStartDateChange: function(e) {
    this.setData({
      startDate: e.detail.value
    });
    // 如果结束日期早于开始日期，清空结束日期
    if (this.data.endDate && this.data.endDate < e.detail.value) {
      this.setData({ endDate: '' });
    }
    this.checkCanSubmit();
  },

  // 结束日期选择
  onEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 减少人数
  decreaseTravelers: function() {
    if (this.data.travelers > 1) {
      this.setData({
        travelers: this.data.travelers - 1
      });
    }
  },

  // 增加人数
  increaseTravelers: function() {
    this.setData({
      travelers: this.data.travelers + 1
    });
  },

  // 选择预算
  onBudgetSelect: function(e) {
    this.setData({
      budget: e.currentTarget.dataset.value
    });
  },

  // 切换偏好
  onPreferenceToggle: function(e) {
    const index = e.currentTarget.dataset.index;
    const preferences = this.data.preferences;
    preferences[index].selected = !preferences[index].selected;
    this.setData({ preferences });
  },

  // 提交表单
  onSubmit: function() {
    if (!this.data.canSubmit) return;

    const tripData = {
      cities: this.data.cities,
      startDate: this.data.startDate,
      endDate: this.data.endDate,
      travelers: this.data.travelers,
      budget: this.data.budget,
      preferences: this.data.preferences
        .filter(p => p.selected)
        .map(p => p.value)
    };

    // 保存到本地存储
    wx.setStorageSync('currentTrip', tripData);

    // 跳转到景点选择页
    wx.navigateTo({
      url: '/pages/spots/spots'
    });
  }
});
