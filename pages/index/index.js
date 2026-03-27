// pages/index/index.js
Page({
  data: {
    searchKey: '',
    recentTrips: []
  },

  onLoad: function() {
    this.loadRecentTrips();
    this.fetchRecommendedSpots();
  },

  // 调用风火轮API获取推荐景点
  fetchRecommendedSpots: function() {
    const baseUrl = 'https://api.fenghuolun.vip';
    wx.request({
      url: baseUrl + '/api/spots/recommend',
      method: 'GET',
      data: {
        appid: 'appid123'
      },
      success: (res) => {
        if (res.data && res.data.code === 0) {
          console.log('推荐景点获取成功', res.data.data);
        }
      },
      fail: (err) => {
        console.error('推荐景点获取失败', err);
      }
    });
  },

  onShow: function() {
    // 每次显示页面时刷新最近行程
    this.loadRecentTrips();
  },

  // 加载最近行程
  loadRecentTrips: function() {
    const trips = wx.getStorageSync('recentTrips') || [];
    this.setData({
      recentTrips: trips.slice(0, 3) // 只显示前3个
    });
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKey: e.detail.value
    });
  },

  // 搜索
  onSearch: function() {
    const key = this.data.searchKey.trim();
    if (key) {
      wx.navigateTo({
        url: '/pages/spots/spots?keyword=' + encodeURIComponent(key)
      });
    }
  },

  // 快速开始
  onQuickStart: function() {
    wx.navigateTo({
      url: '/pages/trip/index'
    });
  },

  // 查看全部行程
  onViewAllTrips: function() {
    wx.navigateTo({
      url: '/pages/plan/plan'
    });
  },

  // 点击行程
  onTripClick: function(e) {
    const tripId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/plan/plan?id=' + tripId
    });
  }
});
