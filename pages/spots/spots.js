// pages/spots/spots.js
const amap = require('../../utils/amap.js');

Page({
  data: {
    keyword: '',
    city: '北京',
    spots: [],
    loading: false,
    noMore: false,
    page: 1,
    pageSize: 10,
    selectedCount: 0,
    useAMap: true // 是否使用高德搜索
  },

  onLoad: function(options) {
    // 如果有搜索关键词
    if (options.keyword) {
      const keyword = options.keyword;
      // 解析城市名
      const cityMatch = keyword.match(/^(北京|上海|广州|深圳|杭州|南京|成都|西安|济南|青岛|厦门|三亚|丽江|大理|桂林|张家界|拉萨|乌鲁木齐|哈尔滨|长春|沈阳|大连|石家庄|太原|郑州|武汉|长沙|南昌|合肥|福州|昆明|贵阳|南宁|海口|兰州|西宁|银川|呼和浩特|拉萨)(.+)?$/);
      if (cityMatch) {
        this.setData({ 
          city: cityMatch[1],
          keyword: cityMatch[2] || ''
        });
      } else {
        this.setData({ keyword: keyword });
      }
    }
    // 获取当前行程的目的地（如果没有从keyword解析出城市）
    if (this.data.city === '北京') {
      const currentTrip = wx.getStorageSync('currentTrip');
      if (currentTrip && currentTrip.destination) {
        this.setData({ city: currentTrip.destination });
      }
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
    // 从关键词中提取城市
    const keyword = this.data.keyword.trim();
    let city = this.data.city;
    
    // 简单解析：如果关键词包含常见城市名，提取出来
    const cityMatch = keyword.match(/^(北京|上海|广州|深圳|杭州|南京|成都|西安|济南|青岛|厦门|三亚|丽江|大理|桂林|张家界|拉萨|乌鲁木齐|哈尔滨|长春|沈阳|大连|石家庄|太原|郑州|武汉|长沙|南昌|合肥|福州|昆明|贵阳|南宁|海口|兰州|西宁|银川|呼和浩特|拉萨)(.+)?$/);
    if (cityMatch) {
      city = cityMatch[1];
      // 更新关键词（去掉城市名）
      const newKeyword = cityMatch[2] || '景点';
      this.setData({
        keyword: newKeyword,
        city: city
      });
    }
    
    this.setData({
      spots: [],
      page: 1,
      noMore: false
    });
    this.loadSpots();
  },

  // 加载景点列表
  loadSpots: async function() {
    if (this.data.loading || this.data.noMore) return;

    this.setData({ loading: true });

    try {
      let spots;
      
      if (this.data.useAMap) {
        // 使用高德 POI 搜索
        spots = await this.searchFromAMap();
      } else {
        // 使用云数据库
        spots = await this.searchFromCloud();
      }

      const newSpots = this.data.page === 1 ? spots : [...this.data.spots, ...spots];
      
      this.setData({
        spots: newSpots,
        loading: false,
        noMore: spots.length < this.data.pageSize
      });

      // 恢复选中状态
      this.restoreSelection();
    } catch (error) {
      console.error('加载景点失败:', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 从高德搜索
  searchFromAMap: async function() {
    const { keyword, city, page, pageSize } = this.data;
    
    try {
      const pois = await amap.searchPOI(keyword || '景点', city, {
        page: page,
        offset: pageSize
      });
      
      return pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        image: poi.photos && poi.photos.length > 0 ? poi.photos[0] : '/images/spot1.jpg',
        tags: poi.type ? poi.type.split(';').slice(0, 2) : ['景点'],
        price: poi.price || 0,
        rating: poi.rating || 4.5,
        address: poi.address,
        longitude: poi.location.longitude,
        latitude: poi.location.latitude,
        distance: poi.distance,
        selected: false
      }));
    } catch (error) {
      console.error('高德搜索失败:', error);
      // 降级到模拟数据
      return this.getMockSpots();
    }
  },

  // 从云数据库搜索
  searchFromCloud: async function() {
    const { keyword, page, pageSize } = this.data;
    
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'spot-search',
        data: {
          keyword: keyword,
          city: this.data.city,
          page: page,
          pageSize: pageSize,
          useAMap: false
        },
        success: (res) => {
          if (res.result.code === 0) {
            resolve(res.result.data.list.map(spot => ({
              ...spot,
              selected: false
            })));
          } else {
            reject(new Error(res.result.message));
          }
        },
        fail: reject
      });
    });
  },

  // 恢复选中状态
  restoreSelection: function() {
    const selectedSpots = wx.getStorageSync('selectedSpots') || [];
    const selectedIds = selectedSpots.map(s => s.id);
    
    const spots = this.data.spots.map(spot => ({
      ...spot,
      selected: selectedIds.includes(spot.id)
    }));
    
    this.setData({
      spots: spots,
      selectedCount: selectedIds.length
    });
  },

  // 模拟数据（降级方案）
  getMockSpots: function() {
    const allSpots = [
      { id: 1, name: '故宫博物院', image: '/images/spot1.jpg', tags: ['历史', '文化'], price: 60, rating: 4.9, address: '北京市东城区景山前街4号' },
      { id: 2, name: '八达岭长城', image: '/images/spot2.jpg', tags: ['历史', '户外'], price: 40, rating: 4.8, address: '北京市延庆区G6京藏高速58号出口' },
      { id: 3, name: '颐和园', image: '/images/spot3.jpg', tags: ['园林', '文化'], price: 30, rating: 4.7, address: '北京市海淀区新建宫门路19号' },
      { id: 4, name: '天坛公园', image: '/images/spot4.jpg', tags: ['历史', '文化'], price: 15, rating: 4.6, address: '北京市东城区天坛东里甲1号' },
      { id: 5, name: '圆明园', image: '/images/spot5.jpg', tags: ['历史', '园林'], price: 10, rating: 4.5, address: '北京市海淀区清华西路28号' },
      { id: 6, name: '鸟巢', image: '/images/spot6.jpg', tags: ['建筑', '体育'], price: 50, rating: 4.4, address: '北京市朝阳区国家体育场南路1号' },
      { id: 7, name: '水立方', image: '/images/spot7.jpg', tags: ['建筑', '体育'], price: 30, rating: 4.3, address: '北京市朝阳区天辰东路11号' },
      { id: 8, name: '798艺术区', image: '/images/spot8.jpg', tags: ['艺术', '文化'], price: 0, rating: 4.5, address: '北京市朝阳区酒仙桥路4号' }
    ];
    
    const start = (this.data.page - 1) * this.data.pageSize;
    return allSpots.slice(start, start + this.data.pageSize);
  },

  // 选择/取消选择景点
  onSelectSpot: function(e) {
    const index = e.currentTarget.dataset.index;
    const spot = this.data.spots[index];
    
    const spots = this.data.spots;
    spots[index].selected = !spots[index].selected;
    
    const selectedCount = spots.filter(s => s.selected).length;
    
    // 获取已选中的景点并保存到本地存储
    const selectedSpots = spots.filter(s => s.selected);
    wx.setStorageSync('selectedSpots', selectedSpots);
    
    this.setData({
      spots: spots,
      selectedCount: selectedCount
    });
  },

  // 加载更多
  onLoadMore: function() {
    if (this.data.loading || this.data.noMore) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.loadSpots();
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
    
    // 保存到本地存储
    wx.setStorageSync('selectedSpots', selectedSpots);
    
    // 跳转到规划页
    wx.navigateTo({
      url: '/pages/plan/plan'
    });
  },

  // 清空选择
  onClearSelected: function() {
    const spots = this.data.spots.map(spot => ({
      ...spot,
      selected: false
    }));
    this.setData({
      spots: spots,
      selectedCount: 0
    });
    wx.setStorageSync('selectedSpots', []);
  },

  // 返回
  onBack: function() {
    wx.navigateBack();
  }
});
