// cloud/functions/init-db/index.js
// 数据库初始化云函数

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 初始景点数据
const defaultSpots = [
  {
    name: '故宫博物院',
    city: '北京',
    tags: ['历史', '文化', '世界遗产'],
    price: 60,
    rating: 4.9,
    duration: '3-4小时',
    location: { type: 'Point', coordinates: [116.3972, 39.9163] },
    address: '北京市东城区景山前街4号',
    openTime: '08:30-17:00',
    description: '中国明清两代的皇家宫殿，旧称紫禁城，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
    images: []
  },
  {
    name: '八达岭长城',
    city: '北京',
    tags: ['历史', '户外', '世界遗产'],
    price: 40,
    rating: 4.8,
    duration: '4-5小时',
    location: { type: 'Point', coordinates: [116.0200, 40.3599] },
    address: '北京市延庆区G6京藏高速58号出口',
    openTime: '06:30-16:30',
    description: '万里长城的重要组成部分，是明长城的一个隘口，景色壮观，是世界文化遗产。',
    images: []
  },
  {
    name: '颐和园',
    city: '北京',
    tags: ['园林', '文化', '休闲'],
    price: 30,
    rating: 4.7,
    duration: '3-4小时',
    location: { type: 'Point', coordinates: [116.2755, 39.9999] },
    address: '北京市海淀区新建宫门路19号',
    openTime: '06:00-20:00',
    description: '中国清朝时期皇家园林，前身为清漪园，坐落在北京西郊，与圆明园毗邻。',
    images: []
  },
  {
    name: '天坛公园',
    city: '北京',
    tags: ['历史', '文化', '世界遗产'],
    price: 15,
    rating: 4.6,
    duration: '2-3小时',
    location: { type: 'Point', coordinates: [116.4066, 39.8822] },
    address: '北京市东城区天坛东里甲1号',
    openTime: '06:00-22:00',
    description: '明清两代皇帝"祭天""祈谷"的场所，主要建筑有祈年殿、皇穹宇、圜丘。',
    images: []
  },
  {
    name: '圆明园',
    city: '北京',
    tags: ['历史', '园林', '遗址'],
    price: 10,
    rating: 4.5,
    duration: '2-3小时',
    location: { type: 'Point', coordinates: [116.2980, 40.0080] },
    address: '北京市海淀区清华西路28号',
    openTime: '07:00-19:00',
    description: '清代大型皇家园林，由圆明园、长春园和绮春园组成，有"万园之园"之称。',
    images: []
  },
  {
    name: '鸟巢',
    city: '北京',
    tags: ['建筑', '体育', '地标'],
    price: 50,
    rating: 4.4,
    duration: '1-2小时',
    location: { type: 'Point', coordinates: [116.3965, 39.9929] },
    address: '北京市朝阳区国家体育场南路1号',
    openTime: '09:00-21:00',
    description: '2008年北京奥运会的主体育场，因其形态如同孕育生命的"巢"和摇篮，寓意希望。',
    images: []
  },
  {
    name: '水立方',
    city: '北京',
    tags: ['建筑', '体育', '地标'],
    price: 30,
    rating: 4.3,
    duration: '1-2小时',
    location: { type: 'Point', coordinates: [116.3840, 39.9900] },
    address: '北京市朝阳区天辰东路11号',
    openTime: '09:00-21:00',
    description: '2008年北京奥运会游泳比赛场馆，与国家体育场（鸟巢）分列于北京城市中轴线北端的两侧。',
    images: []
  },
  {
    name: '798艺术区',
    city: '北京',
    tags: ['艺术', '文化', '创意'],
    price: 0,
    rating: 4.5,
    duration: '2-3小时',
    location: { type: 'Point', coordinates: [116.4960, 39.9850] },
    address: '北京市朝阳区酒仙桥路4号',
    openTime: '10:00-18:00',
    description: '原为国营798厂等电子工业的老厂区所在地，现已发展成为北京都市文化的新地标。',
    images: []
  }
];

// 初始化数据库
exports.main = async (event, context) => {
  const { force = false } = event;
  
  try {
    // 检查是否已初始化
    const existingCount = await db.collection('spots').count();
    
    if (existingCount.total > 0 && !force) {
      return {
        code: 0,
        message: '数据库已初始化，使用 force=true 强制重新初始化',
        data: { count: existingCount.total }
      };
    }
    
    // 清空现有数据（如果 force=true）
    if (force && existingCount.total > 0) {
      // 注意：云数据库不支持批量删除，需要逐条删除或使用云函数递归删除
      console.log('强制重新初始化，跳过清空步骤');
    }
    
    // 批量添加景点
    const batch = db.collection('spots');
    const addPromises = defaultSpots.map(spot => 
      batch.add({ data: spot })
    );
    
    await Promise.all(addPromises);
    
    // 创建索引
    await db.collection('spots').createIndex({
      name: 'text',
      tags: 'text'
    });
    
    await db.collection('spots').createIndex({
      location: '2dsphere'
    });
    
    return {
      code: 0,
      message: '数据库初始化成功',
      data: { 
        imported: defaultSpots.length,
        cities: [...new Set(defaultSpots.map(s => s.city))]
      }
    };
    
  } catch (error) {
    console.error('初始化失败:', error);
    return {
      code: -1,
      message: '初始化失败：' + error.message
    };
  }
};
