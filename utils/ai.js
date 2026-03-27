// utils/ai.js - AI 服务
const AI_CONFIG = {
  baseURL: 'https://api.kimi.com/coding/',  // Kimi API
  apiKey: 'YOUR_API_KEY', // 需要替换为真实的API Key
  model: 'kimi-for-coding'
};

class AIService {
  // 生成行程规划
  async generatePlan(tripData, spots) {
    const prompt = this.buildPlanPrompt(tripData, spots);
    
    try {
      const response = await this.callAI(prompt);
      return this.parsePlanResponse(response, tripData, spots);
    } catch (error) {
      console.error('AI规划失败:', error);
      // 降级到本地算法
      return this.fallbackPlan(tripData, spots);
    }
  }

  // 构建提示词
  buildPlanPrompt(tripData, spots) {
    const { destination, startDate, endDate, travelers, budget, preferences } = tripData;
    
    const days = this.calculateDays(startDate, endDate);
    const budgetText = { low: '经济型', medium: '舒适型', high: '豪华型' }[budget];
    
    return `请为${destination}制定${days}天旅行行程。

出行信息：
- 人数：${travelers}人
- 预算：${budgetText}
- 偏好：${preferences.join(',') || '无特殊偏好'}
- 日期：${startDate} 至 ${endDate}

可选景点：
${spots.map((s, i) => `${i + 1}. ${s.name} - ${s.tags.join(',')} (门票¥${s.price})`).join('\n')}

请按以下JSON格式返回行程规划：
{
  "dailyPlan": [
    {
      "day": 1,
      "theme": "当日主题",
      "spots": [
        {
          "id": "景点ID",
          "name": "景点名称",
          "startTime": "09:00",
          "endTime": "12:00",
          "duration": "3小时",
          "tips": "游览建议"
        }
      ],
      "meals": {
        "breakfast": "早餐建议",
        "lunch": "午餐建议",
        "dinner": "晚餐建议"
      },
      "transport": "交通方式"
    }
  ],
  "estimatedCost": {
    "tickets": 门票总费用,
    "accommodation": 预估住宿费用,
    "meals": 预估餐饮费用,
    "transport": 预估交通费用,
    "other": 其他费用,
    "total": 总费用
  }
}`;
  }

  // 调用AI API
  async callAI(prompt) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: AI_CONFIG.baseURL + 'v1/chat/completions',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: '你是一个专业的旅行规划师，擅长制定详细的旅行行程。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        },
        success: (res) => {
          if (res.data && res.data.choices && res.data.choices[0]) {
            resolve(res.data.choices[0].message.content);
          } else {
            reject(new Error('AI响应格式错误'));
          }
        },
        fail: reject
      });
    });
  }

  // 解析AI响应
  parsePlanResponse(response, tripData, spots) {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        
        // 添加summary
        plan.summary = {
          destination: tripData.destination,
          days: this.calculateDays(tripData.startDate, tripData.endDate),
          travelers: tripData.travelers,
          budget: tripData.budget,
          totalSpots: spots.length,
          estimatedCost: plan.estimatedCost
        };
        
        return plan;
      }
    } catch (e) {
      console.error('解析AI响应失败:', e);
    }
    
    // 解析失败，使用降级方案
    return this.fallbackPlan(tripData, spots);
  }

  // 降级方案：本地算法
  fallbackPlan(tripData, spots) {
    const { destination, startDate, endDate, travelers, budget } = tripData;
    const days = this.calculateDays(startDate, endDate);
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
        transport: '地铁+步行'
      });
    }
    
    const ticketCost = spots.reduce((sum, s) => sum + (s.price || 0), 0) * travelers;
    const dailyCost = { low: 300, medium: 600, high: 1200 }[budget] || 600;
    
    return {
      summary: {
        destination,
        days,
        travelers,
        budget,
        totalSpots: spots.length,
        estimatedCost: {
          tickets: ticketCost,
          accommodation: dailyCost * 0.4 * days * travelers,
          meals: dailyCost * 0.3 * days * travelers,
          transport: dailyCost * 0.2 * days * travelers,
          other: dailyCost * 0.1 * days * travelers,
          total: ticketCost + dailyCost * days * travelers
        }
      },
      dailyPlan
    };
  }

  // 计算天数
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }
}

module.exports = new AIService();
