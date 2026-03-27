// pages/index/index.js
Page({
  data: {
    searchKey: '',
    recentTrips: []
  },

  onLoad: function() {
    this.loadRecentTrips();
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
      url: '/pages/input/input'
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
