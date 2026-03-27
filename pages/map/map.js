// pages/map/map.js
Page({
  data: {
    // 地图中心位置（北京）
    longitude: 116.397428,
    latitude: 39.90923,
    scale: 12,
    // 标记点
    markers: [],
    // 路线
    polyline: [],
    // 景点列表
    spots: [],
    // 面板展开状态
    panelExpanded: false
  },

  onLoad: function() {
    this.loadSpots();
  },

  onReady: function() {
    this.mapContext = wx.createMapContext('tripMap');
  },

  // 加载景点数据
  loadSpots: function() {
    // 从本地存储获取选择的景点
    const selectedSpots = wx.getStorageSync('selectedSpots');
    
    if (selectedSpots && selectedSpots.length > 0) {
      // 添加坐标信息（实际应该从后端获取）
      const spotsWithLocation = selectedSpots.map((spot, index) => ({
        ...spot,
        latitude: this.getSpotLatitude(spot.id),
        longitude: this.getSpotLongitude(spot.id),
        address: this.getSpotAddress(spot.id),
        time: `Day ${Math.floor(index / 2) + 1}`,
        distance: index > 0 ? (Math.random() * 5 + 1).toFixed(1) : null
      }));

      this.setData({
        spots: spotsWithLocation
      });

      this.updateMapMarkers(spotsWithLocation);
      this.updatePolyline(spotsWithLocation);
      this.fitMapBounds(spotsWithLocation);
    } else {
      // 使用默认数据
      this.setDefaultSpots();
    }
  },

  // 获取景点纬度（模拟数据）
  getSpotLatitude: function(id) {
    const latMap = {
      1: 39.9163,  // 故宫
      2: 40.3599,  // 长城
      3: 39.9999,  // 颐和园
      4: 39.8822,  // 天坛
      5: 40.0080,  // 圆明园
      6: 39.9929,  // 鸟巢
      7: 39.9900,  // 水立方
      8: 39.9850   // 798
    };
    return latMap[id] || 39.9 + Math.random() * 0.1;
  },

  // 获取景点经度（模拟数据）
  getSpotLongitude: function(id) {
    const lngMap = {
      1: 116.3972,
      2: 116.0200,
      3: 116.2755,
      4: 116.4066,
      5: 116.2980,
      6: 116.3965,
      7: 116.3840,
      8: 116.4960
    };
    return lngMap[id] || 116.3 + Math.random() * 0.1;
  },

  // 获取景点地址
  getSpotAddress: function(id) {
    const addressMap = {
      1: '北京市东城区景山前街4号',
      2: '北京市延庆区G6京藏高速58号出口',
      3: '北京市海淀区新建宫门路19号',
      4: '北京市东城区天坛东里甲1号',
      5: '北京市海淀区清华西路28号',
      6: '北京市朝阳区国家体育场南路1号',
      7: '北京市朝阳区天辰东路11号',
      8: '北京市朝阳区酒仙桥路4号'
    };
    return addressMap[id] || '北京市';
  },

  // 设置默认景点
  setDefaultSpots: function() {
    const defaultSpots = [
      { id: 1, name: '故宫博物院', image: '/images/spot1.jpg', latitude: 39.9163, longitude: 116.3972, address: '北京市东城区景山前街4号', time: 'Day 1' },
      { id: 4, name: '天坛公园', image: '/images/spot4.jpg', latitude: 39.8822, longitude: 116.4066, address: '北京市东城区天坛东里甲1号', time: 'Day 1', distance: 3.2 },
      { id: 2, name: '八达岭长城', image: '/images/spot2.jpg', latitude: 40.3599, longitude: 116.0200, address: '北京市延庆区G6京藏高速58号出口', time: 'Day 2', distance: 45.6 },
      { id: 3, name: '颐和园', image: '/images/spot3.jpg', latitude: 39.9999, longitude: 116.2755, address: '北京市海淀区新建宫门路19号', time: 'Day 3', distance: 28.4 }
    ];

    this.setData({ spots: defaultSpots });
    this.updateMapMarkers(defaultSpots);
    this.updatePolyline(defaultSpots);
    this.fitMapBounds(defaultSpots);
  },

  // 更新地图标记
  updateMapMarkers: function(spots) {
    const markers = spots.map((spot, index) => ({
      id: spot.id,
      latitude: spot.latitude,
      longitude: spot.longitude,
      title: spot.name,
      iconPath: '/images/marker.png',
      width: 40,
      height: 40,
      label: {
        content: `${index + 1}`,
        color: '#fff',
        fontSize: 24,
        anchorX: 0,
        anchorY: -30,
        bgColor: '#1890ff',
        padding: 8,
        borderRadius: 20
      }
    }));

    this.setData({ markers });
  },

  // 更新路线
  updatePolyline: function(spots) {
    const points = spots.map(s => ({
      latitude: s.latitude,
      longitude: s.longitude
    }));

    const polyline = [{
      points: points,
      color: '#1890ff',
      width: 4,
      dottedLine: false,
      arrowLine: true
    }];

    this.setData({ polyline });
  },

  // 调整地图视野
  fitMapBounds: function(spots) {
    if (spots.length === 0) return;

    const latitudes = spots.map(s => s.latitude);
    const longitudes = spots.map(s => s.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // 计算中心点
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    this.setData({
      latitude: centerLat,
      longitude: centerLng
    });

    // 调整缩放级别以显示所有标记
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let scale = 12;
    if (maxDiff > 0.5) scale = 10;
    else if (maxDiff > 0.2) scale = 11;
    else if (maxDiff > 0.1) scale = 12;
    else scale = 13;

    this.setData({ scale });
  },

  // 点击标记
  onMarkerTap: function(e) {
    const markerId = e.markerId;
    const spot = this.data.spots.find(s => s.id === markerId);
    
    if (spot) {
      wx.showModal({
        title: spot.name,
        content: spot.address,
        confirmText: '导航',
        success: (res) => {
          if (res.confirm) {
            this.openNavigation(spot);
          }
        }
      });
    }
  },

  // 点击景点
  onSpotTap: function(e) {
    const index = e.currentTarget.dataset.index;
    const spot = this.data.spots[index];
    
    // 移动到该位置
    this.setData({
      latitude: spot.latitude,
      longitude: spot.longitude,
      scale: 15
    });
  },

  // 导航
  onNavigate: function(e) {
    const index = e.currentTarget.dataset.index;
    const spot = this.data.spots[index];
    this.openNavigation(spot);
  },

  // 打开导航
  openNavigation: function(spot) {
    wx.openLocation({
      latitude: spot.latitude,
      longitude: spot.longitude,
      name: spot.name,
      address: spot.address,
      scale: 18
    });
  },

  // 切换面板
  onTogglePanel: function() {
    this.setData({
      panelExpanded: !this.data.panelExpanded
    });
  },

  // 重置定位
  onResetLocation: function() {
    this.fitMapBounds(this.data.spots);
  },

  // 显示路线
  onShowRoute: function() {
    wx.showToast({
      title: '路线规划完成',
      icon: 'success'
    });
  },

  // 返回行程
  onBackToPlan: function() {
    wx.navigateBack();
  }
});
