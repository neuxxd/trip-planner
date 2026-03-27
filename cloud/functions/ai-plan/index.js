// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 模拟AI规划逻辑
function generatePlan(tripData, spots) {
  const { destination, startDate, endDate, travelers, budget, preferences } = tripData;
  
  // 计算天数
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // 按天数分配景点
  const dailyPlan = [];
  const spotsPerDay = Math.min(3, Math.ceil(spots.length / days));
  
  for (let i = 0; i < days; i++) {
    const daySpots = spots.slice(i * spotsPerDay, (i + 1) * spotsPerDay);
    
    dailyPlan.push({
      day: i + 1,
      date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      spots: daySpots.map(spot => ({
        id: spot.id,
        name: spot.name,
        image: spot.image,
        startTime: '09:00',
        endTime: '12:00',
        duration: '3小时',
        tips: '建议早上去，避开人流高峰'
      })),
      meals: {
        breakfast: '酒店早餐',
        lunch: '当地特色餐厅',
        dinner: '推荐美食街'
      },
      transport: '地铁+步行',
      accommodation: i === 0 ? '入住' + destination + '市中心酒店' : null
    });
  }
  
  return {
    summary: {
      destination,
      days,
      travelers,
      budget,
      totalSpots: spots.length,
      estimatedCost: calculateCost(spots, days, travelers, budget)
    },
    dailyPlan
  };
}

// 计算预估费用
function calculateCost(spots, days, travelers, budget) {
  const ticketCost = spots.reduce((sum, s) => sum + s.price, 0) * travelers;
  const dailyCost = { low: 300, medium: 600, high: 1200 }[budget] || 600;
  const totalCost = ticketCost + dailyCost * days * travelers;
  
  return {
    tickets: ticketCost,
    accommodation: dailyCost * 0.4 * days * travelers,
    meals: dailyCost * 0.3 * days * travelers,
    transport: dailyCost * 0.2 * days * travelers,
    other: dailyCost * 0.1 * days * travelers,
    total: totalCost
  };
}

// 主函数
exports.main = async (event, context) => {
  const { tripData, spots } = event;
  
  try {
    // 参数校验
    if (!tripData || !spots || spots.length === 0) {
      return {
        code: -1,
        message: '参数错误：缺少行程数据或景点数据'
      };
    }
    
    // 生成规划
    const plan = generatePlan(tripData, spots);
    
    return {
      code: 0,
      message: 'success',
      data: plan
    };
    
  } catch (error) {
    console.error('AI规划失败:', error);
    return {
      code: -1,
      message: '规划失败：' + error.message
    };
  }
};
