// pages/plan/plan.js
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
      // 如果没有数据，使用模拟数据
      this.setMockData();
      return;
    }

    // 调用云函数生成规划
    this.generatePlan(tripData, selectedSpots);
  },

  // 生成规划
  generatePlan: function(tripData, spots) {
    wx.showLoading({ title: '生成规划中...' });

    wx.cloud.callFunction({
      name: 'ai-plan',
      data: {
        tripData,
        spots
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result.code === 0) {
        this.setData({
          plan: res.result.data
        });
        // 保存到最近行程
        this.saveToRecentTrips(tripData, res.result.data);
      } else {
        wx.showToast({
          title: res.result.message,
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('生成规划失败:', err);
      
      // 判断错误类型
      let errorMsg = '生成规划失败';
      if (err.errCode === -601034 || err.message?.includes('没有权限') || err.message?.includes('云开发')) {
        errorMsg = '云开发未开通，无法生成AI规划';
      } else if (err.message?.includes('timeout')) {
        errorMsg = '请求超时，请重试';
      }
      
      wx.showModal({
        title: '生成失败',
        content: errorMsg + '，是否使用默认规划？',
        confirmText: '使用默认',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            // 使用本地模拟数据
            this.setMockData(tripData, spots);
          } else {
            // 返回上一页
            wx.navigateBack();
          }
        }
      });
    });
  },

  // 设置模拟数据
  setMockData: function(tripData, spots) {
    const cities = tripData?.cities || ['北京'];
    const city = cities[0];
    const days = this.calculateDays(tripData?.startDate, tripData?.endDate) || 3;
    const travelers = tripData?.travelers || 2;
    
    // 使用用户选择的景点生成规划
    const dailyPlan = [];
    const spotsPerDay = Math.ceil((spots?.length || 6) / days);
    
    for (let i = 0; i < days; i++) {
      const daySpots = spots?.slice(i * spotsPerDay, (i + 1) * spotsPerDay) || [];
      if (daySpots.length === 0) break;
      
      dailyPlan.push({
        day: i + 1,
        date: this.addDays(tripData?.startDate, i),
        spots: daySpots.map((spot, idx) => ({
          ...spot,
          startTime: `${9 + idx * 3}:00`,
          endTime: `${12 + idx * 3}:00`,
          duration: '3小时',
          tips: '建议合理安排时间'
        })),
        meals: {
          breakfast: '酒店早餐',
          lunch: '当地特色餐厅',
          dinner: '推荐美食'
        },
        transport: '公共交通+步行',
        accommodation: i < days - 1 ? `入住${city}酒店` : null
      });
    }
    
    const mockPlan = {
      summary: {
        destination: city,
        days: days,
        travelers: travelers,
        budget: tripData?.budget || 'medium',
        totalSpots: spots?.length || 0,
        estimatedCost: {
          tickets: 200 * (spots?.length || 6),
          accommodation: 400 * days * Math.ceil(travelers / 2),
          meals: 150 * days * travelers,
          transport: 100 * days,
          other: 200,
          total: 0
        }
      },
      dailyPlan: dailyPlan
    };
    
    // 计算总费用
    mockPlan.summary.estimatedCost.total = 
      mockPlan.summary.estimatedCost.tickets +
      mockPlan.summary.estimatedCost.accommodation +
      mockPlan.summary.estimatedCost.meals +
      mockPlan.summary.estimatedCost.transport +
      mockPlan.summary.estimatedCost.other;

    this.setData({
      plan: mockPlan
    });
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
      name: tripData.destination + ' ' + plan.summary.days + '日游',
      destination: tripData.destination,
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
