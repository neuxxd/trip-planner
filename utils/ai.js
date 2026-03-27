// utils/ai.js - MiniMax AI 服务
const AI_CONFIG = {
  baseURL: 'https://api.minimax.chat/v1',  // MiniMax API
  apiKey: 'YOUR_MINIMAX_API_KEY', // 需要替换为真实的 MiniMax API Key
  groupId: 'YOUR_GROUP_ID', // MiniMax Group ID
  model: 'abab5.5-chat'  // MiniMax 模型
};

class AIService {
  // 生成行程规划
  async generatePlan(tripData, spots) {
    const prompt = this.buildPlanPrompt(tripData, spots);
    
    try {
      const response = await this.callMiniMax(prompt);
      return this.parsePlanResponse(response, tripData, spots);
    } catch (error) {
      console.error('MiniMax 规划失败:', error);
      throw error;
    }
  }

  // 构建提示词
  buildPlanPrompt(tripData, spots) {
    const { destination, startDate, endDate, travelers, budget, preferences } = tripData;
    const days = this.calculateDays(startDate, endDate);
    const budgetText = { low: '经济型', medium: '舒适型', high: '豪华型' }[budget];
    
    return `作为专业旅行规划师，请为${destination}制定${days}天行程。

【用户偏好】
- 人数：${travelers}人
- 预算：${budgetText}
- 偏好：${preferences.join(',') || '无特殊偏好'}
- 日期：${startDate} 至 ${endDate}

【可选景点】
${spots.map((s, i) => `${i + 1}. ${s.name}: ${s.tags.join(',')}，门票¥${s.price}，建议游玩${s.duration || '2-3小时'}`).join('\n')}

请按以下JSON格式返回行程规划：
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

  // 调用 MiniMax API
  async callMiniMax(prompt) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${AI_CONFIG.baseURL}/text/chatcompletion_v2`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: AI_CONFIG.model,
          messages: [
            { 
              role: 'system', 
              content: '你是一个专业的旅行规划师，擅长制定详细的旅行行程。请严格按照用户要求的JSON格式返回。' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        },
        success: (res) => {
          if (res.data && res.data.choices && res.data.choices[0]) {
            resolve(res.data.choices[0].message.content);
          } else if (res.data && res.data.base_resp && res.data.base_resp.status_code !== 0) {
            reject(new Error(`MiniMax错误: ${res.data.base_resp.status_msg}`));
          } else {
            reject(new Error('MiniMax响应格式错误'));
          }
        },
        fail: (err) => {
          reject(new Error(`请求失败: ${err.errMsg}`));
        }
      });
    });
  }

  // 解析 AI 响应
  parsePlanResponse(response, tripData, spots) {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        
        // 添加 summary
        plan.summary = {
          destination: tripData.destination,
          days: this.calculateDays(tripData.startDate, tripData.endDate),
          travelers: tripData.travelers,
          budget: tripData.budget,
          totalSpots: spots.length,
          estimatedCost: plan.estimatedCost || this.calculateDefaultCost(spots, tripData)
        };
        
        return plan;
      }
      throw new Error('无法从响应中提取JSON');
    } catch (e) {
      console.error('解析 MiniMax 响应失败:', e);
      console.error('原始响应:', response);
      throw new Error('AI返回格式错误，请重试');
    }
  }

  // 计算默认费用（备用）
  calculateDefaultCost(spots, tripData) {
    const days = this.calculateDays(tripData.startDate, tripData.endDate);
    const ticketCost = spots.reduce((sum, s) => sum + (s.price || 0), 0) * tripData.travelers;
    const dailyCost = { low: 300, medium: 600, high: 1200 }[tripData.budget] || 600;
    
    return {
      tickets: ticketCost,
      accommodation: dailyCost * 0.4 * days * tripData.travelers,
      meals: dailyCost * 0.3 * days * tripData.travelers,
      transport: dailyCost * 0.2 * days * tripData.travelers,
      other: dailyCost * 0.1 * days * tripData.travelers,
      total: ticketCost + dailyCost * days * tripData.travelers
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
