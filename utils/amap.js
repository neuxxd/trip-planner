// utils/amap.js - 高德地图服务
const AMAP_KEY = '283d2c6a7ccb59cc152d195eaef2c0db'; // 小程序SDK Key
const AMAP_WEB_KEY = '18de1150066194333cd5a2800770ea9a'; // Web服务API Key

class AMapService {
  constructor() {
    this.baseURL = 'https://restapi.amap.com/v3';
  }

  // ========== 地理编码 ==========
  
  /**
   * 地理编码：地址转换为坐标
   * @param {string} address - 地址
   * @param {string} city - 城市（可选）
   * @returns {Promise<{longitude: number, latitude: number}>}
   */
  async geocode(address, city = '') {
    const url = `${this.baseURL}/geocode/geo?key=${AMAP_WEB_KEY}&address=${encodeURIComponent(address)}${city ? '&city=' + city : ''}`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1' && res.data.geocodes && res.data.geocodes.length > 0) {
            const location = res.data.geocodes[0].location.split(',');
            resolve({
              longitude: parseFloat(location[0]),
              latitude: parseFloat(location[1]),
              formattedAddress: res.data.geocodes[0].formatted_address
            });
          } else {
            reject(new Error(res.data.info || '地理编码失败'));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 逆地理编码：坐标转换为地址
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @returns {Promise<Object>}
   */
  async reverseGeocode(longitude, latitude) {
    const url = `${this.baseURL}/geocode/regeo?key=${AMAP_WEB_KEY}&location=${longitude},${latitude}&extensions=base`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1' && res.data.regeocode) {
            resolve({
              address: res.data.regeocode.formatted_address,
              province: res.data.regeocode.addressComponent.province,
              city: res.data.regeocode.addressComponent.city,
              district: res.data.regeocode.addressComponent.district
            });
          } else {
            reject(new Error(res.data.info || '逆地理编码失败'));
          }
        },
        fail: reject
      });
    });
  }

  // ========== 路线规划 ==========
  
  /**
   * 路线规划
   * @param {Object} origin - 起点 {longitude, latitude}
   * @param {Object} destination - 终点 {longitude, latitude}
   * @param {string} mode - 出行方式：driving|walking|transit|bicycling
   * @returns {Promise<Object>}
   */
  async calculateRoute(origin, destination, mode = 'driving') {
    const originStr = `${origin.longitude},${origin.latitude}`;
    const destStr = `${destination.longitude},${destination.latitude}`;
    
    let url;
    switch (mode) {
      case 'walking':
        url = `${this.baseURL}/direction/walking?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destStr}`;
        break;
      case 'transit':
        url = `${this.baseURL}/direction/transit/integrated?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destStr}&city=北京`;
        break;
      case 'bicycling':
        url = `${this.baseURL}/direction/riding?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destStr}`;
        break;
      case 'driving':
      default:
        url = `${this.baseURL}/direction/driving?key=${AMAP_WEB_KEY}&origin=${originStr}&destination=${destStr}&extensions=base`;
        break;
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1' && res.data.route && res.data.route.paths) {
            const path = res.data.route.paths[0];
            resolve({
              distance: parseInt(path.distance), // 米
              duration: parseInt(path.duration), // 秒
              tolls: parseInt(path.tolls || 0), // 过路费
              strategy: path.strategy,
              steps: path.steps.map(step => ({
                instruction: step.instruction,
                distance: step.distance,
                duration: step.duration,
                polyline: step.polyline
              }))
            });
          } else {
            reject(new Error(res.data.info || '路线规划失败'));
          }
        },
        fail: reject
      });
    });
  }

  // ========== 距离矩阵 ==========
  
  /**
   * 距离矩阵：计算多起点到多终点的距离和时间
   * @param {Array} origins - 起点数组 [{longitude, latitude}]
   * @param {Array} destinations - 终点数组 [{longitude, latitude}]
   * @param {string} mode - 出行方式
   * @returns {Promise<Array>}
   */
  async calculateDistanceMatrix(origins, destinations, mode = 'driving') {
    const originsStr = origins.map(o => `${o.longitude},${o.latitude}`).join('|');
    const destsStr = destinations.map(d => `${d.longitude},${d.latitude}`).join('|');
    
    const type = mode === 'walking' ? 3 : mode === 'bicycling' ? 2 : 1;
    const url = `${this.baseURL}/distance?key=${AMAP_WEB_KEY}&origins=${originsStr}&destination=${destsStr}&type=${type}`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1' && res.data.results) {
            const matrix = [];
            for (let i = 0; i < origins.length; i++) {
              const row = [];
              for (let j = 0; j < destinations.length; j++) {
                const index = i * destinations.length + j;
                const result = res.data.results[index];
                row.push({
                  distance: parseInt(result.distance), // 米
                  duration: parseInt(result.duration), // 秒
                  origin: origins[i],
                  destination: destinations[j]
                });
              }
              matrix.push(row);
            }
            resolve(matrix);
          } else {
            reject(new Error(res.data.info || '距离矩阵计算失败'));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 优化景点游览顺序（TSP近似算法）
   * @param {Array} spots - 景点数组，每个包含 {id, name, longitude, latitude}
   * @param {Object} startPoint - 起点 {longitude, latitude}
   * @returns {Promise<Array>} 优化后的景点顺序
   */
  async optimizeRoute(spots, startPoint) {
    if (spots.length <= 1) return spots;
    
    try {
      // 构建距离矩阵
      const allPoints = [startPoint, ...spots];
      const matrix = await this.calculateDistanceMatrix(allPoints, allPoints);
      
      // 贪心算法：每次选择最近的未访问景点
      const visited = new Set([0]); // 起点已访问
      const order = [0];
      let current = 0;
      
      while (visited.size < allPoints.length) {
        let minDist = Infinity;
        let nextIdx = -1;
        
        for (let i = 0; i < allPoints.length; i++) {
          if (!visited.has(i) && matrix[current][i].distance < minDist) {
            minDist = matrix[current][i].distance;
            nextIdx = i;
          }
        }
        
        if (nextIdx !== -1) {
          visited.add(nextIdx);
          order.push(nextIdx);
          current = nextIdx;
        }
      }
      
      // 转换为景点顺序（去掉起点）
      return order.slice(1).map(idx => spots[idx - 1]);
    } catch (error) {
      console.error('路线优化失败:', error);
      return spots; // 失败时返回原顺序
    }
  }

  // ========== POI 搜索 ==========
  
  /**
   * 搜索 POI
   * @param {string} keyword - 关键词
   * @param {string} city - 城市
   * @param {Object} options - 其他选项
   * @returns {Promise<Array>}
   */
  async searchPOI(keyword, city = '北京', options = {}) {
    const { 
      types = '', // POI类型
      radius = 5000, // 搜索半径
      page = 1,
      offset = 20
    } = options;
    
    let url = `${this.baseURL}/place/text?key=${AMAP_WEB_KEY}&keywords=${encodeURIComponent(keyword)}&city=${city}&offset=${offset}&page=${page}&extensions=all`;
    
    if (types) url += `&types=${types}`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1') {
            const pois = res.data.pois || [];
            resolve(pois.map(poi => ({
              id: poi.id,
              name: poi.name,
              type: poi.type,
              address: poi.address,
              location: {
                longitude: parseFloat(poi.location.split(',')[0]),
                latitude: parseFloat(poi.location.split(',')[1])
              },
              tel: poi.tel,
              rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : null,
              price: poi.biz_ext?.lowest_price ? parseFloat(poi.biz_ext.lowest_price) : null,
              photos: poi.photos ? poi.photos.map(p => p.url) : [],
              distance: poi.distance ? parseInt(poi.distance) : null
            })));
          } else {
            reject(new Error(res.data.info || '搜索失败'));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 周边搜索
   * @param {Object} center - 中心点 {longitude, latitude}
   * @param {string} keywords - 关键词
   * @param {number} radius - 半径（米）
   * @returns {Promise<Array>}
   */
  async searchNearby(center, keywords = '', radius = 3000) {
    const location = `${center.longitude},${center.latitude}`;
    const url = `${this.baseURL}/place/around?key=${AMAP_WEB_KEY}&location=${location}&keywords=${encodeURIComponent(keywords)}&radius=${radius}&extensions=all`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: (res) => {
          if (res.data.status === '1') {
            const pois = res.data.pois || [];
            resolve(pois.map(poi => ({
              id: poi.id,
              name: poi.name,
              type: poi.type,
              address: poi.address,
              location: {
                longitude: parseFloat(poi.location.split(',')[0]),
                latitude: parseFloat(poi.location.split(',')[1])
              },
              distance: parseInt(poi.distance),
              rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : null
            })));
          } else {
            reject(new Error(res.data.info || '周边搜索失败'));
          }
        },
        fail: reject
      });
    });
  }

  // ========== 工具方法 ==========
  
  /**
   * 格式化距离
   * @param {number} distance - 距离（米）
   * @returns {string}
   */
  formatDistance(distance) {
    if (distance < 1000) {
      return `${distance}米`;
    }
    return `${(distance / 1000).toFixed(1)}公里`;
  }

  /**
   * 格式化时间
   * @param {number} duration - 时间（秒）
   * @returns {string}
   */
  formatDuration(duration) {
    if (duration < 60) {
      return `${duration}秒`;
    }
    if (duration < 3600) {
      return `${Math.floor(duration / 60)}分钟`;
    }
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

module.exports = new AMapService();
