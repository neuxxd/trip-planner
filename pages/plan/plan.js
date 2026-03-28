// pages/plan/plan.js - 本地生成规划，不依赖云开发
Page({
  data: {
    plan: {
      summary: null,
      dailyPlan: []
    }
  },

  onLoad: function(options) {
    this.loadPlan();
  },

  onShow: function() {
    this.loadPlan();
  },

  // 加载行程规划
  loadPlan: function() {
    // 从本地存储获取数据
    const tripData = wx.getStorageSync('currentTrip');
    const selectedSpots = wx.getStorageSync('selectedSpots');
    
    if (!tripData || !selectedSpots || selectedSpots.length === 0) {
      wx.showToast({
        title: '请先选择景点',
        icon: 'none'
      });
      return;
    }

    // 本地生成规划
    this.generateLocalPlan(tripData, selectedSpots);
  },

  // 本地生成规划（不调用云开发）
  generateLocalPlan: function(tripData, spots) {
    wx.showLoading({ title: '生成规划中...' });

    // 模拟异步处理
    setTimeout(() => {
      wx.hideLoading();
      
      // 生成本地规划
      const plan = this.createPlan(tripData, spots);
      
      this.setData({
        plan: plan
      });
      
      // 保存到最近行程
      this.saveToRecentTrips(tripData, plan);
      
      wx.showToast({
        title: '规划生成完成',
        icon: 'success'
      });
    }, 500);
  },

  // 创建规划数据
  createPlan: function(tripData, spots) {
    const cities = tripData?.cities || ['北京'];
    const city = cities[0];
    const days = this.calculateDays(tripData?.startDate, tripData?.endDate) || 3;
    const travelers = tripData?.travelers || 2;
    
    // 按天数分配景点
    const dailyPlan = [];
    const spotsPerDay = Math.max(2, Math.ceil(spots.length / days)); // 每天至少2个景点
    
    for (let i = 0; i < days; i++) {
      const daySpots = spots.slice(i * spotsPerDay, (i + 1) * spotsPerDay);
      if (daySpots.length === 0) break;
      
      // 为每个景点分配时间
      const scheduledSpots = daySpots.map((spot, idx) => {
        const startHour = 9 + idx * 3; // 每个景点3小时
        const endHour = startHour + 3;
        return {
          ...spot,
          startTime: `${startHour}:00`,
          endTime: `${endHour}:00`,
          duration: '3小时',
          tips: this.generateTips(spot, idx)
        };
      });
      
      dailyPlan.push({
        day: i + 1,
        date: this.addDays(tripData?.startDate, i),
        spots: scheduledSpots,
        meals: this.generateMeals(i, city),
        transport: i === 0 ? '从酒店出发' : '公共交通+步行',
        accommodation: i < days - 1 ? `入住${city}酒店` : null
      });
    }
    
    // 计算费用
    const estimatedCost = this.calculateCost(spots.length, days, travelers);
    
    return {
      summary: {
        destination: city,
        cities: cities,
        days: days,
        travelers: travelers,
        budget: tripData?.budget || 'medium',
        totalSpots: spots.length,
        estimatedCost: estimatedCost
      },
      dailyPlan: dailyPlan
    };
  },

  // 生成景点提示
  generateTips: function(spot, index) {
    const tips = [
      '建议早上去，避开人流高峰',
      '可以预留更多时间拍照',
      '附近有特色小吃值得尝试',
      '建议提前预订门票',
      '穿舒适的鞋子，方便游览',
      '傍晚时分景色最美'
    ];
    return tips[index % tips.length];
  },

  // 生成餐饮推荐
  generateMeals: function(dayIndex, city) {
    const meals = [
      { breakfast: '酒店早餐', lunch: `${city}特色餐厅`, dinner: '当地美食推荐' },
      { breakfast: '酒店早餐', lunch: '景点附近餐厅', dinner: '网红餐厅打卡' },
      { breakfast: '酒店早餐', lunch: '特色小吃', dinner: '告别晚餐' }
    ];
    return meals[dayIndex % meals.length];
  },

  // 计算费用
  calculateCost: function(spotCount, days, travelers) {
    const roomCount = Math.ceil(travelers / 2);
    const tickets = 100 * spotCount * travelers; // 门票
    const accommodation = 400 * days * roomCount; // 住宿
    const meals = 150 * days * travelers; // 餐饮
    const transport = 100 * days; // 交通
    const other = 200; // 其他
    
    return {
      tickets,
      accommodation,
      meals,
      transport,
      other,
      total: tickets + accommodation + meals + transport + other
    };
  },

  // 计算天数
  calculateDays: function(startDate, endDate) {
    if (!startDate || !endDate) return 3;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  },

  // 添加天数
  addDays: function(dateStr, days) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // 保存到最近行程
  saveToRecentTrips: function(tripData, plan) {
    const recentTrips = wx.getStorageSync('recentTrips') || [];
    
    const newTrip = {
      id: Date.now(),
      name: plan.summary.destination + ' ' + plan.summary.days + '日游',
      destination: plan.summary.destination,
      date: tripData.startDate,
      cover: plan.dailyPlan[0]?.spots[0]?.image || '/images/default.jpg',
      plan: plan
    };

    // 添加到开头，最多保留10条
    recentTrips.unshift(newTrip);
    if (recentTrips.length > 10) {
      recentTrips.pop();
    }

    wx.setStorageSync('recentTrips', recentTrips);
  },

  // 保存行程
  onSave: function() {
    wx.showToast({
      title: '行程已保存',
      icon: 'success'
    });
  },

  // 查看地图
  onViewMap: function() {
    wx.navigateTo({
      url: '/pages/map/map'
    });
  }
});
