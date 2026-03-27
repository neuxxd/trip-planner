// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 模拟景点数据库
const mockSpotsDB = [
  {
    id: 1,
    name: '故宫博物院',
    image: '/images/spot1.jpg',
    tags: ['历史', '文化', '世界遗产'],
    rating: 4.9,
    price: 60,
    location: { lat: 39.9163, lng: 116.3972 },
    city: '北京'
  },
  {
    id: 2,
    name: '八达岭长城',
    image: '/images/spot2.jpg',
    tags: ['历史', '户外', '世界遗产'],
    rating: 4.8,
    price: 40,
    location: { lat: 40.3599, lng: 116.0200 },
    city: '北京'
  },
  {
    id: 3,
    name: '颐和园',
    image: '/images/spot3.jpg',
    tags: ['园林', '文化', '休闲'],
    rating: 4.7,
    price: 30,
    location: { lat: 39.9999, lng: 116.2755 },
    city: '北京'
  },
  {
    id: 4,
    name: '天坛公园',
    image: '/images/spot4.jpg',
    tags: ['历史', '文化', '世界遗产'],
    rating: 4.6,
    price: 15,
    location: { lat: 39.8822, lng: 116.4066 },
    city: '北京'
  },
  {
    id: 5,
    name: '圆明园',
    image: '/images/spot5.jpg',
    tags: ['历史', '园林', '遗址'],
    rating: 4.5,
    price: 10,
    location: { lat: 40.0080, lng: 116.2980 },
    city: '北京'
  },
  {
    id: 6,
    name: '鸟巢',
    image: '/images/spot6.jpg',
    tags: ['建筑', '体育', '地标'],
    rating: 4.4,
    price: 50,
    location: { lat: 39.9929, lng: 116.3965 },
    city: '北京'
  },
  {
    id: 7,
    name: '水立方',
    image: '/images/spot7.jpg',
    tags: ['建筑', '体育', '地标'],
    rating: 4.3,
    price: 30,
    location: { lat: 39.9900, lng: 116.3840 },
    city: '北京'
  },
  {
    id: 8,
    name: '798艺术区',
    image: '/images/spot8.jpg',
    tags: ['艺术', '文化', '创意'],
    rating: 4.5,
    price: 0,
    location: { lat: 39.9850, lng: 116.4960 },
    city: '北京'
  }
];

// 搜索景点
function searchSpots(keyword, city, page, pageSize) {
  let results = [...mockSpotsDB];
  
  // 按城市筛选
  if (city) {
    results = results.filter(s => s.city.includes(city));
  }
  
  // 按关键词搜索
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    results = results.filter(s => 
      s.name.toLowerCase().includes(lowerKeyword) ||
      s.tags.some(t => t.toLowerCase().includes(lowerKeyword))
    );
  }
  
  // 分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    list: results.slice(start, end),
    total: results.length,
    hasMore: end < results.length
  };
}

// 主函数
exports.main = async (event, context) => {
  const { 
    keyword = '', 
    city = '', 
    page = 1, 
    pageSize = 10,
    sortBy = 'rating' // rating, price, distance
  } = event;
  
  try {
    const result = searchSpots(keyword, city, page, pageSize);
    
    // 排序
    if (sortBy === 'rating') {
      result.list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price') {
      result.list.sort((a, b) => a.price - b.price);
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
