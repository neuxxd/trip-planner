// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 高德地图配置
const AMAP_WEB_KEY = process.env.AMAP_WEB_KEY || '18de1150066194333cd5a2800770ea9a';

// 搜索景点
async function searchFromDB(keyword, city, page, pageSize) {
  let query = db.collection('spots');
  
  // 城市筛选
  if (city) {
    query = query.where({ city: city });
  }
  
  // 关键词搜索（名称或标签）
  if (keyword) {
    query = query.where(_.or([
      { name: db.RegExp({ regexp: keyword, options: 'i' }) },
      { tags: db.RegExp({ regexp: keyword, options: 'i' }) }
    ]));
  }
  
  // 分页查询
  const total = await query.count();
  
  const list = await query
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .orderBy('rating', 'desc')
    .get();
  
  return {
    list: list.data,
    total: total.total,
    hasMore: (page * pageSize) < total.total
  };
}

// 从高德 API 搜索（备用）
async function searchFromAMap(keyword, city, page, pageSize, amapKey) {
  const axios = require('axios');
  
  try {
    const response = await axios.get('https://restapi.amap.com/v3/place/text', {
      params: {
        key: amapKey,
        keywords: keyword,
        city: city || '北京',
        offset: pageSize,
        page: page,
        extensions: 'all'
      },
      timeout: 5000
    });
    
    if (response.data.status === '1') {
      const pois = response.data.pois || [];
      return {
        list: pois.map(poi => ({
          id: poi.id,
          name: poi.name,
          city: poi.cityname || city || '北京',
          address: poi.address,
          tags: poi.type.split(';').slice(0, 3),
          price: 0, // 高德API不返回价格
          rating: parseFloat(poi.biz_ext?.rating) || 4.0,
          location: {
            type: 'Point',
            coordinates: poi.location.split(',').map(Number).reverse() // [lng, lat]
          },
          images: poi.photos ? poi.photos.map(p => p.url) : []
        })),
        total: parseInt(response.data.count) || pois.length,
        hasMore: pois.length === pageSize
      };
    }
    throw new Error('高德API返回错误');
  } catch (error) {
    console.error('高德搜索失败:', error.message);
    throw error;
  }
}

// 主函数
exports.main = async (event, context) => {
  const { 
    keyword = '', 
    city = '', 
    page = 1, 
    pageSize = 10,
    sortBy = 'rating', // rating, price, distance
    useAMap = false, // 是否使用高德API
    amapKey = '' // 高德Key（如果使用高德API）
  } = event;
  
  try {
    let result;
    
    if (useAMap && amapKey) {
      // 使用高德API
      result = await searchFromAMap(keyword, city, page, pageSize, amapKey);
    } else {
      // 使用云数据库
      result = await searchFromDB(keyword, city, page, pageSize);
    }
    
    // 排序
    if (sortBy === 'price') {
      result.list.sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    
    return {
      code: 0,
      message: 'success',
      data: result
    };
    
  } catch (error) {
    console.error('搜索失败:', error);
    return {
      code: -1,
      message: '搜索失败：' + error.message
    };
  }
};
