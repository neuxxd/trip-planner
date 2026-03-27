// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// MiniMax 配置
const MINIMAX_CONFIG = {
  baseURL: 'https://api.minimax.chat/v1',
  apiKey: process.env.MINIMAX_API_KEY,
  model: 'abab5.5-chat'
};

// 高德地图配置
const AMAP_WEB_KEY = process.env.AMAP_WEB_KEY || '18de1150066194333cd5a2800770ea9a';

// 调用 MiniMax API
async function callMiniMax(prompt) {
  const axios = require('axios');
  
  try {
    const response = await axios.post(
      `${MINIMAX_CONFIG.baseURL}/text/chatcompletion_v2`,
      {
        model: MINIMAX_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划师，擅长制定详细的旅行行程。请严格按照用户要求的JSON格式返回，不要添加任何markdown格式标记。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000 // 20秒超时
      }
    );
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }
    throw new Error('MiniMax 响应格式错误');
  } catch (error) {
    console.error('MiniMax API 调用失败:', error.message);
    throw error;
  }
}

// 构建提示词
function buildPrompt(tripData, spots) {
  const { destination, startDate, endDate, travelers, budget, preferences } = tripData;
  const days = calculateDays(startDate, endDate);
  const budgetText = { low: '经济型', medium: '舒适型', high: '豪华型' }[budget];
  
  return `作为专业旅行规划师，请为${destination}制定${days}天行程。

【用户偏好】
- 人数：${travelers}人
- 预算：${budgetText}
- 偏好：${preferences.join(',') || '无特殊偏好'}
- 日期：${startDate} 至 ${endDate}

【可选景点】
${spots.map((s, i) => `${i + 1}. ${s.name}: ${s.tags.join(',')}，门票¥${s.price}，建议游玩${s.duration || '2-3小时'}`).join('\n')}

请严格按照以下JSON格式返回行程规划，不要添加markdown标记：
{
  "dailyPlan": [
    {
      "day": 1,
      "theme": "当日主题（如：皇城文化之旅）",
      "spots": [
        {
          "id": "景点ID",
          "name": "景点名",
          "startTime": "09:00",
          "endTime": "12:00",
          "duration": "3小时",
          "tips": "游览建议"
        }
      ],
      "meals": { "breakfast": "...", "lunch": "...", "dinner": "..." },
      "transport": "地铁+步行",
      "notes": "当日特别提醒"
    }
  ],
  "estimatedCost": { 
    "tickets": 100, 
    "accommodation": 500, 
    "meals": 300,
    "transport": 200,
    "other": 100,
    "total": 1200
  },
  "aiSummary": "AI对整体行程的简要说明"
}`;
}

// 解析响应
function parseResponse(response, tripData, spots) {
  try {
    // 清理可能的 markdown 标记
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // 提取 JSON
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('响应中未找到 JSON');
    }
    
    const plan = JSON.parse(jsonMatch[0]);
    const days = calculateDays(tripData.startDate, tripData.endDate);
    
    // 添加 summary
    plan.summary = {
      destination: tripData.destination,
      days: days,
      travelers: tripData.travelers,
      budget: tripData.budget,
      totalSpots: spots.length,
      estimatedCost: plan.estimatedCost || calculateDefaultCost(spots, tripData, days)
    };
    
    return plan;
  } catch (e) {
    console.error('解析响应失败:', e);
    console.error('原始响应:', response);
    throw new Error('AI返回格式错误');
  }
}

// 计算天数
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

// 计算默认费用
function calculateDefaultCost(spots, tripData, days) {
  const ticketCost = spots.reduce((sum, s) => sum + (s.price || 0), 0) * tripData.travelers;
  const dailyCost = { low: 300, medium: 600, high: 1200 }[tripData.budget] || 600;
  
  return {
    tickets: ticketCost,
    accommodation: Math.round(dailyCost * 0.4 * days * tripData.travelers),
    meals: Math.round(dailyCost * 0.3 * days * tripData.travelers),
    transport: Math.round(dailyCost * 0.2 * days * tripData.travelers),
    other: Math.round(dailyCost * 0.1 * days * tripData.travelers),
    total: ticketCost + dailyCost * days * tripData.travelers
  };
}

// 保存到云数据库
async function saveToDatabase(tripData, plan, spots) {
  const db = cloud.database();
  
  try {
    // 保存行程
    const tripResult = await db.collection('trips').add({
      data: {
        ...tripData,
        _openid: cloud.getWXContext().OPENID,
        status: 'completed',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });
    
    // 保存规划结果
    await db.collection('plans').add({
      data: {
        tripId: tripResult._id,
        dailyPlan: plan.dailyPlan,
        estimatedCost: plan.estimatedCost,
        aiSummary: plan.aiSummary,
        spots: spots,
        createdAt: db.serverDate()
      }
    });
    
    return tripResult._id;
  } catch (error) {
    console.error('保存到数据库失败:', error);
    // 不影响返回结果
    return null;
  }
}

// 主函数
exports.main = async (event, context) => {
  const { tripData, spots, saveToDB = true } = event;
  
  // 参数校验
  if (!tripData || !spots || spots.length === 0) {
    return {
      code: -1,
      message: '参数错误：缺少行程数据或景点数据'
    };
  }
  
  // 检查 API Key
  if (!MINIMAX_CONFIG.apiKey) {
    return {
      code: -1,
      message: '服务配置错误：缺少 AI API Key'
    };
  }
  
  try {
    // 构建提示词
    const prompt = buildPrompt(tripData, spots);
    
    // 调用 MiniMax
    const aiResponse = await callMiniMax(prompt);
    
    // 解析响应
    const plan = parseResponse(aiResponse, tripData, spots);
    
    // 保存到数据库（可选）
    let tripId = null;
    if (saveToDB) {
      tripId = await saveToDatabase(tripData, plan, spots);
    }
    
    return {
      code: 0,
      message: 'success',
      data: {
        ...plan,
        tripId: tripId
      }
    };
    
  } catch (error) {
    console.error('生成规划失败:', error);
    return {
      code: -1,
      message: '生成规划失败：' + error.message
    };
  }
};
