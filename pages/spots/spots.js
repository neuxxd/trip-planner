// pages/spots/spots.js
Page({
  data: {
    keyword: '',
    spots: [],
    loading: false,
    noMore: false,
    page: 1,
    pageSize: 10,
    selectedCount: 0
  },

  onLoad: function(options) {
    // 如果有搜索关键词
    if (options.keyword) {
      this.setData({ keyword: options.keyword });
    }
    this.loadSpots();
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 搜索
  onSearch: function() {
    this.setData({
      spots: [],
      page: 1,
      noMore: false
    });
    this.loadSpots();
  },

  // 加载景点列表
  loadSpots: function() {
    if (this.data.loading || this.data.noMore) return;

    this.setData({ loading: true });

    // 模拟数据（实际应该调用 API）
    const mockSpots = this.getMockSpots();
    
    setTimeout(() => {
      const spots = this.data.page === 1 ? mockSpots : [...this.data.spots, ...mockSpots];
      
      this.setData({
        spots: spots,
        loading: false,
        noMore: this.data.page >= 3 // 模拟只有3页数据
      });
      
      this.updateSelectedCount();
    }, 500);
  },

  // 模拟景点数据
  getMockSpots: function() {
    const baseSpots = [
      {
        id: 1,
        name: '故宫博物院',
        image: '/images/spot1.jpg',
        tags: ['历史', '文化', '世界遗产'],
        rating: 4.9,
        price: 60
      },
      {
        id: 2,
        name: '八达岭长城',
        image: '/images/spot2.jpg',
        tags: ['历史', '户外', '世界遗产'],
        rating: 4.8,
        price: 40
      },
      {
        id: 3,
        name: '颐和园',
        image: '/images/spot3.jpg',
        tags: ['园林', '文化', '休闲'],
        rating: 4.7,
        price: 30
      },
      {
        id: 4,
        name: '天坛公园',
        image: '/images/spot4.jpg',
        tags: ['历史', '文化', '世界遗产'],
        rating: 4.6,
        price: 15
      },
      {
        id: 5,
        name: '圆明园',
        image: '/images/spot5.jpg',
        tags: ['历史', '园林', '遗址'],
        rating: 4.5,
        price: 10
      }
    ];

    // 根据页码生成不同数据
    return baseSpots.map((spot, index) => ({
      ...spot,
      id: spot.id + (this.data.page - 1) * 5,
      selected: false
    }));
  },

  // 加载更多
  onLoadMore: function() {
    if (!this.data.noMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadSpots();
    }
  },

  // 选择/取消景点
  onSpotToggle: function(e) {
    const index = e.currentTarget.dataset.index;
    const spots = this.data.spots;
    spots[index].selected = !spots[index].selected;
    
    this.setData({ spots });
    this.updateSelectedCount();
  },

  // 更新已选数量
  updateSelectedCount: function() {
    const count = this.data.spots.filter(s => s.selected).length;
    this.setData({ selectedCount: count });
  },

  // 清空选择
  onClearSelected: function() {
    const spots = this.data.spots.map(s => ({
      ...s,
      selected: false
    }));
    
    this.setData({ spots });
    this.updateSelectedCount();
  },

  // 下一步
  onNext: function() {
    const selectedSpots = this.data.spots.filter(s => s.selected);
    
    if (selectedSpots.length === 0) {
      wx.showToast({
        title: '请至少选择一个景点',
        icon: 'none'
      });
      return;
    }

    // 保存选择的景点
    wx.setStorageSync('selectedSpots', selectedSpots);

    // 跳转到规划页
    wx.navigateTo({
      url: '/pages/plan/plan'
    });
  }
});
