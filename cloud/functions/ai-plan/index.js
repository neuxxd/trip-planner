// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 调用外部AI API
async function callAIAPI(tripData, spots) {
  const { destination, startDate, endDate, travelers, budget, preferences } = tripData;
  const days = calculateDays(startDate, endDate);
  const budgetText = { low: '经济型', medium: '舒适型', high: '豪华型' }[budget];
  
  const prompt = `请为${destination}制定${days}天旅行行程。
出行信息：${travelers}人，${budgetText}预算，偏好：${preferences.join(',') || '无'}。
可选景点：${spots.map(s => s.name).join('、')}。
请返回JSON格式的行程规划，包含dailyPlan和estimatedCost。`;

  try {
    // 这里可以接入真实的AI API
    // 示例：Kimi、OpenAI、文心一言等
    const response = await cloud.callFunction({
      name: 'ai-service',
      data: { prompt }
    });
    
    return response.result;
  } catch (error) {
    console.error('AI API调用失败:', error);
    return null;
  }
}

// 计算天数
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

// 本地规划算法（降级方案）
function generatePlan(tripData, spots) {
  const { destination, startDate, endDate, travelers, budget, preferences } = tripData;
  const days = calculateDays(startDate, endDate);
  const spotsPerDay = Math.min(3, Math.ceil(spots.length / days));
  
  const dailyPlan = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    const daySpots = spots.slice(i * spotsPerDay, (i + 1) * spotsPerDay);
    
    dailyPlan.push({
      day: i + 1,
      date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: `第${i + 1}天行程`,
      spots: daySpots.map((spot, idx) => ({
        id: spot.id,
        name: spot.name,
        image: spot.image,
        startTime: `${9 + idx * 4}:00`,
        endTime: `${12 + idx * 4}:00`,
        duration: '3小时',
        tips: '建议提前预订门票'
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
  const ticketCost = spots.reduce((sum, s) => sum + (s.price || 0), 0) * travelers;
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
