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
      // 使用本地模拟数据
      this.setMockData();
    });
  },

  // 设置模拟数据
  setMockData: function() {
    const mockPlan = {
      summary: {
        destination: '北京',
        days: 3,
        travelers: 2,
        budget: 'medium',
        totalSpots: 6,
        estimatedCost: {
          tickets: 310,
          accommodation: 1440,
          meals: 1080,
          transport: 720,
          other: 360,
          total: 3910
        }
      },
      dailyPlan: [
        {
          day: 1,
          date: '2024-05-01',
          spots: [
            {
              id: 1,
              name: '故宫博物院',
              image: '/images/spot1.jpg',
              startTime: '09:00',
              endTime: '12:00',
              duration: '3小时',
              tips: '建议早上去，避开人流高峰'
            },
            {
              id: 4,
              name: '天坛公园',
              image: '/images/spot4.jpg',
              startTime: '14:00',
              endTime: '17:00',
              duration: '3小时',
              tips: '傍晚时分景色最美'
            }
          ],
          meals: {
            breakfast: '酒店早餐',
            lunch: '故宫附近餐厅',
            dinner: '前门大街美食'
          },
          transport: '地铁+步行',
          accommodation: '入住北京市中心酒店'
        },
        {
          day: 2,
          date: '2024-05-02',
          spots: [
            {
              id: 2,
              name: '八达岭长城',
              image: '/images/spot2.jpg',
              startTime: '08:00',
              endTime: '14:00',
              duration: '6小时',
              tips: '穿舒适的鞋子，带足水'
            }
          ],
          meals: {
            breakfast: '酒店早餐',
            lunch: '长城脚下餐厅',
            dinner: '烤鸭店'
          },
          transport: '旅游专线巴士',
          accommodation: null
        },
        {
          day: 3,
          date: '2024-05-03',
          spots: [
            {
              id: 3,
              name: '颐和园',
              image: '/images/spot3.jpg',
              startTime: '09:00',
              endTime: '13:00',
              duration: '4小时',
              tips: '可以租船游湖'
            },
            {
              id: 5,
              name: '圆明园',
              image: '/images/spot5.jpg',
              startTime: '14:30',
              endTime: '17:00',
              duration: '2.5小时',
              tips: '了解历史背景游览更有意义'
            }
          ],
          meals: {
            breakfast: '酒店早餐',
            lunch: '颐和园附近',
            dinner: '告别晚餐'
          },
          transport: '地铁+打车',
          accommodation: null
        }
      ]
    };

    this.setData({
      plan: mockPlan
    });
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
