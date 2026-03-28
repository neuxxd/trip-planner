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
    // 注意：需要在微信小程序后台添加 https://api.fenghuolun.vip 到 request 合法域名
    // 临时注释，等待域名配置完成
    /*
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
    */
    console.log('推荐景点API已禁用，请在微信小程序后台添加 api.fenghuolun.vip 到合法域名');
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
