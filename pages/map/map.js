// pages/map/map.js
const amap = require('../../utils/amap.js');

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
    // 优化后的路线
    optimizedRoute: [],
    // 面板展开状态
    panelExpanded: false,
    // 加载状态
    loading: false,
    // 当前交通方式
    transportMode: 'driving', // driving, walking, transit
    // 总距离和时长
    totalDistance: 0,
    totalDuration: 0,
    formattedDistance: '',
    formattedDuration: ''
  },

  onLoad: function() {
    this.loadSpots();
  },

  onReady: function() {
    this.mapContext = wx.createMapContext('tripMap');
  },

  // 加载景点数据
  loadSpots: async function() {
    const selectedSpots = wx.getStorageSync('selectedSpots');
    
    if (selectedSpots && selectedSpots.length > 0) {
      this.setData({ loading: true });
      
      try {
        // 获取景点坐标（使用真实坐标或地理编码）
        const spotsWithLocation = await this.enrichSpotsWithLocation(selectedSpots);
        
        this.setData({
          spots: spotsWithLocation,
          loading: false
        });

        // 更新地图
        this.updateMapMarkers(spotsWithLocation);
        this.fitMapBounds(spotsWithLocation);
        
        // 优化路线
        await this.optimizeRoute(spotsWithLocation);
      } catch (error) {
        console.error('加载景点失败:', error);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } else {
      this.setDefaultSpots();
    }
  },

  // 为景点添加坐标信息
  enrichSpotsWithLocation: async function(spots) {
    const enrichedSpots = [];
    
    for (let i = 0; i < spots.length; i++) {
      const spot = spots[i];
      
      // 如果已有坐标，直接使用
      if (spot.longitude && spot.latitude) {
        enrichedSpots.push({
          ...spot,
          order: i + 1
        });
      } else {
        // 使用地理编码获取坐标
        try {
          const location = await amap.geocode(spot.name, spot.city || '北京');
          enrichedSpots.push({
            ...spot,
            longitude: location.longitude,
            latitude: location.latitude,
            address: location.formattedAddress || spot.address,
            order: i + 1
          });
        } catch (error) {
          console.error(`地理编码失败: ${spot.name}`, error);
          // 使用默认坐标
          enrichedSpots.push({
            ...spot,
            longitude: 116.397428 + Math.random() * 0.1,
            latitude: 39.90923 + Math.random() * 0.1,
            order: i + 1
          });
        }
      }
    }
    
    return enrichedSpots;
  },

  // 优化路线
  optimizeRoute: async function(spots) {
    if (spots.length < 2) {
      this.updatePolyline(spots);
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      // 使用起点（第一个景点或用户位置）
      const startPoint = {
        longitude: spots[0].longitude,
        latitude: spots[0].latitude
      };
      
      // 优化景点顺序
      const optimizedSpots = await amap.optimizeRoute(spots, startPoint);
      
      // 计算路线详情
      const routeDetails = await this.calculateRouteDetails(optimizedSpots);
      
      this.setData({
        optimizedRoute: optimizedSpots,
        spots: optimizedSpots,
        totalDistance: routeDetails.totalDistance,
        totalDuration: routeDetails.totalDuration,
        formattedDistance: routeDetails.formattedDistance,
        formattedDuration: routeDetails.formattedDuration,
        loading: false
      });
      
      // 更新地图显示
      this.updateMapMarkers(optimizedSpots);
      this.updatePolyline(optimizedSpots);
      
    } catch (error) {
      console.error('路线优化失败:', error);
      this.setData({ loading: false });
      // 使用原始顺序
      this.updatePolyline(spots);
    }
  },

  // 计算路线详情
  calculateRouteDetails: async function(spots) {
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < spots.length - 1; i++) {
      try {
        const route = await amap.calculateRoute(
          { longitude: spots[i].longitude, latitude: spots[i].latitude },
          { longitude: spots[i + 1].longitude, latitude: spots[i + 1].latitude },
          this.data.transportMode
        );
        
        totalDistance += route.distance;
        totalDuration += route.duration;
        
        // 保存路段信息
        spots[i + 1].routeFromPrev = {
          distance: route.distance,
          duration: route.duration,
          formattedDistance: amap.formatDistance(route.distance),
          formattedDuration: amap.formatDuration(route.duration)
        };
      } catch (error) {
        console.error(`计算路线失败: ${spots[i].name} -> ${spots[i + 1].name}`, error);
      }
    }
    
    return { 
      totalDistance, 
      totalDuration,
      formattedDistance: totalDistance > 1000 ? (totalDistance/1000).toFixed(1) + 'km' : totalDistance + 'm',
      formattedDuration: totalDuration > 3600 ? Math.floor(totalDuration/3600) + 'h' + Math.floor((totalDuration%3600)/60) + 'min' : Math.floor(totalDuration/60) + 'min'
    };
  },

  // 设置默认景点
  setDefaultSpots: function() {
    const defaultSpots = [
      { id: 1, name: '故宫博物院', image: '/images/spot1.jpg', latitude: 39.9163, longitude: 116.3972, address: '北京市东城区景山前街4号', order: 1 },
      { id: 4, name: '天坛公园', image: '/images/spot4.jpg', latitude: 39.8822, longitude: 116.4066, address: '北京市东城区天坛东里甲1号', order: 2 },
      { id: 2, name: '八达岭长城', image: '/images/spot2.jpg', latitude: 40.3599, longitude: 116.0200, address: '北京市延庆区G6京藏高速58号出口', order: 3 },
      { id: 3, name: '颐和园', image: '/images/spot3.jpg', latitude: 39.9999, longitude: 116.2755, address: '北京市海淀区新建宫门路19号', order: 4 }
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
      },
      callout: {
        content: spot.name,
        color: '#000',
        fontSize: 14,
        borderRadius: 4,
        padding: 8,
        display: 'BYCLICK'
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

    const colors = {
      driving: '#1890ff',
      walking: '#52c41a',
      transit: '#faad14'
    };

    const polyline = [{
      points: points,
      color: colors[this.data.transportMode] || '#1890ff',
      width: 6,
      dottedLine: false,
      arrowLine: true,
      borderWidth: 2,
      borderColor: '#fff'
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

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    this.setData({
      latitude: centerLat,
      longitude: centerLng
    });

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

  // 切换交通方式
  onChangeTransportMode: function(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ transportMode: mode });
    
    // 重新计算路线
    if (this.data.spots.length > 1) {
      this.optimizeRoute(this.data.spots);
    }
  },

  // 点击标记
  onMarkerTap: function(e) {
    const markerId = e.markerId;
    const spot = this.data.spots.find(s => s.id === markerId);
    
    if (spot) {
      wx.showModal({
        title: spot.name,
        content: `${spot.address}\n${spot.routeFromPrev ? '距上一点: ' + spot.routeFromPrev.formattedDistance + ' (' + spot.routeFromPrev.formattedDuration + ')' : ''}`,
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
    const { totalDistance, totalDuration } = this.data;
    
    wx.showModal({
      title: '路线总览',
      content: `总距离: ${amap.formatDistance(totalDistance)}\n总时长: ${amap.formatDuration(totalDuration)}`,
      showCancel: false
    });
  },

  // 搜索周边
  onSearchNearby: async function() {
    try {
      const center = {
        longitude: this.data.longitude,
        latitude: this.data.latitude
      };
      
      const pois = await amap.searchNearby(center, '餐厅', 3000);
      
      // 添加为临时标记
      const nearbyMarkers = pois.slice(0, 5).map((poi, index) => ({
        id: 1000 + index,
        latitude: poi.location.latitude,
        longitude: poi.location.longitude,
        title: poi.name,
        iconPath: '/images/marker.png',
        width: 30,
        height: 30,
        alpha: 0.7
      }));
      
      this.setData({
        markers: [...this.data.markers, ...nearbyMarkers]
      });
      
      wx.showToast({ title: `找到${pois.length}个周边餐厅`, icon: 'none' });
    } catch (error) {
      wx.showToast({ title: '搜索失败', icon: 'none' });
    }
  },

  // 返回行程
  onBackToPlan: function() {
    wx.navigateBack();
  }
});
