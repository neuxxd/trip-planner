// utils/amap.js - 高德地图服务
const AMAP_KEY = 'YOUR_AMAP_KEY'; // 需要替换为真实的高德地图Key

class AMapService {
  // 地理编码：地址转坐标
  async geocode(address) {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(address)}`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1' && res.data.geocodes.length > 0) {
            const location = res.data.geocodes[0].location.split(',');
            resolve({
              longitude: parseFloat(location[0]),
              latitude: parseFloat(location[1])
            });
          } else {
            reject(new Error('地理编码失败'));
          }
        },
        fail: reject
      });
    });
  }

  // 计算路线
  async calculateRoute(origin, destination, mode = 'driving') {
    const url = `https://restapi.amap.com/v3/direction/${mode}?key=${AMAP_KEY}&origin=${origin}&destination=${destination}`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1') {
            const route = res.data.route.paths[0];
            resolve({
              distance: parseInt(route.distance),
              duration: parseInt(route.duration),
              steps: route.steps
            });
          } else {
            reject(new Error('路线计算失败'));
          }
        },
        fail: reject
      });
    });
  }

  // 距离矩阵
  async calculateDistanceMatrix(origins, destinations) {
    const originsStr = origins.map(o => `${o.longitude},${o.latitude}`).join('|');
    const destinationsStr = destinations.map(d => `${d.longitude},${d.latitude}`).join('|');
    
    const url = `https://restapi.amap.com/v3/distance?key=${AMAP_KEY}&origins=${originsStr}&destination=${destinationsStr}&type=1`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1') {
            resolve(res.data.results.map(r => ({
              distance: parseInt(r.distance),
              duration: parseInt(r.duration)
            })));
          } else {
            reject(new Error('距离矩阵计算失败'));
          }
        },
        fail: reject
      });
    });
  }

  // 搜索POI
  async searchPOI(keyword, city) {
    const url = `https://restapi.amap.com/v3/place/text?key=${AMAP_KEY}&keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city || '北京')}&offset=20&page=1`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1') {
            resolve(res.data.pois.map(poi => ({
              id: poi.id,
              name: poi.name,
              address: poi.address,
              location: poi.location,
              type: poi.type
            })));
          } else {
            reject(new Error('POI搜索失败'));
          }
        },
        fail: reject
      });
    });
  }
}

module.exports = new AMapService();
