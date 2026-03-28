// pages/plan/plan.js - 使用 MiniMax AI 生成规划
const MINIMAX_CONFIG = {
  baseURL: 'https://api.minimaxi.chat/v1',
  apiKey: 'sk-api-W5V8JrRpS_3oHI169bn8RF7ir2hoBNPrL-u0szfKTwr9mYo2WCL5y6e8R7VXlYh-FBMlpX4SPWtoOs4k6Wrt1eFda9QKQdRnTafxQa2gl2PB67GlrSUz420',
  model: 'abab5.5-chat'
};

Page({
  data: {
    plan: {
      summary: null,
      dailyPlan: []
    },
    loading: false
  },

  onLoad: function(options) {
    this.loadPlan();
  },

  onShow: function() {
    this.loadPlan();
  },

  // 加载行程规划
  loadPlan: function() {
    const tripData = wx.getStorageSync('currentTrip');
    const selectedSpots = wx.getStorageSync('selectedSpots');
    
    if (!tripData || !selectedSpots || selectedSpots.length === 0) {
      wx.showToast({
        title: '请先选择景点',
        icon: 'none'
      });
      return;
    }

    // 调用 AI 生成规划
    this.generateAIPlan(tripData, selectedSpots);
  },

  // 调用 MiniMax AI 生成规划
  generateAIPlan: async function(tripData, spots) {
    this.setData({ loading: true });
    wx.showLoading({ title: 'AI规划中...' });

    try {
      const prompt = this.buildPrompt(tripData, spots);
      const aiResponse = await this.callMiniMax(prompt);
      const plan = this.parseAIResponse(aiResponse, tripData, spots);
      
      this.setData({
        plan: plan,
        loading: false
      });
      
      this.saveToRecentTrips(tripData, plan);
      
      wx.showToast({
        title: '规划完成',
        icon: 'success'
      });
    } catch (error) {
      console.error('AI规划失败:', error);
      wx.showToast({
        title: 'AI规划失败，使用默认规划',
        icon: 'none'
      });
      // 降级到本地规划
      this.generateLocalPlan(tripData, spots);
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  // 构建 Prompt
  buildPrompt: function(tripData, spots) {
    const cities = tripData.cities || ['未知城市'];
    const days = this.calculateDays(tripData.startDate, tripData.endDate);
    const travelers = tripData.travelers || 2;
    const budget = tripData.budget || 'medium';
    const preferences = tripData.preferences || [];
    
    const spotList = spots.map((s, i) => `${i + 1}. ${s.name} (${s.address || ''})`).join('\n');
    
    return `请为以下行程制定详细的旅行规划：

【行程信息】
- 目的地：${cities.join('、')}
- 出行天数：${days}天
- 出行人数：${travelers}人
- 预算水平：${budget === 'low' ? '经济型' : budget === 'high' ? '豪华型' : '舒适型'}
- 旅行偏好：${preferences.join('、') || '无特殊偏好'}
- 日期：${tripData.startDate} 至 ${tripData.endDate}

【已选景点】
${spotList}

【要求】
1. 将景点合理分配到每一天，考虑地理位置和游览时间
2. 每天安排2-4个景点，避免过于紧凑
3. 为每个景点安排合理的游览时间段
4. 提供实用的游览建议和注意事项
5. 推荐每天的餐饮安排
6. 预估整体费用（门票、住宿、餐饮、交通）

【输出格式】
请严格按照以下JSON格式返回，不要添加任何markdown标记：
{
  "summary": {
    "destination": "目的地",
    "days": ${days},
    "travelers": ${travelers},
    "totalSpots": ${spots.length},
    "estimatedCost": {
      "tickets": 门票费用,
      "accommodation": 住宿费用,
      "meals": 餐饮费用,
      "transport": 交通费用,
      "other": 其他费用,
      "total": 总费用
    }
  },
  "dailyPlan": [
    {
      "day": 1,
      "date": "${tripData.startDate}",
      "spots": [
        {
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
      "transport": "交通方式",
      "accommodation": "住宿建议"
    }
  ]
}`;
  },

  // 调用 MiniMax API
  callMiniMax: function(prompt) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${MINIMAX_CONFIG.baseURL}/text/chatcompletion_v2`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${MINIMAX_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: MINIMAX_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: '你是专业的旅行规划师，擅长制定详细、实用的旅行行程。请严格按照用户要求的JSON格式返回，不要添加任何markdown格式标记。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        },
        timeout: 30000,
        success: (res) => {
          if (res.statusCode === 200 && res.data.choices && res.data.choices[0]) {
            resolve(res.data.choices[0].message.content);
          } else {
            reject(new Error('MiniMax API 返回错误'));
          }
        },
        fail: reject
      });
    });
  },

  // 解析 AI 响应
  parseAIResponse: function(content, tripData, spots) {
    try {
      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        // 补充景点图片等信息
        plan.dailyPlan.forEach(day => {
          day.spots.forEach(spot => {
            const matchedSpot = spots.find(s => s.name === spot.name);
            if (matchedSpot) {
              spot.image = matchedSpot.image;
              spot.id = matchedSpot.id;
              spot.address = matchedSpot.address;
            }
          });
        });
        return plan;
      }
    } catch (e) {
      console.error('解析AI响应失败:', e);
    }
    throw new Error('无法解析AI响应');
  },

  // 本地规划（降级方案）
  generateLocalPlan: function(tripData, spots) {
    const cities = tripData?.cities || ['北京'];
    const city = cities[0];
    const days = this.calculateDays(tripData?.startDate, tripData?.endDate) || 3;
    const travelers = tripData?.travelers || 2;
    
    const dailyPlan = [];
    const spotsPerDay = Math.max(2, Math.ceil(spots.length / days));
    
    for (let i = 0; i < days; i++) {
      const daySpots = spots.slice(i * spotsPerDay, (i + 1) * spotsPerDay);
      if (daySpots.length === 0) break;
      
      const scheduledSpots = daySpots.map((spot, idx) => ({
        ...spot,
        startTime: `${9 + idx * 3}:00`,
        endTime: `${12 + idx * 3}:00`,
        duration: '3小时',
        tips: '建议合理安排时间'
      }));
      
      dailyPlan.push({
        day: i + 1,
        date: this.addDays(tripData?.startDate, i),
        spots: scheduledSpots,
        meals: {
          breakfast: '酒店早餐',
          lunch: `${city}特色餐厅`,
          dinner: '当地美食推荐'
        },
        transport: '公共交通+步行',
        accommodation: i < days - 1 ? `入住${city}酒店` : null
      });
    }
    
    const plan = {
      summary: {
        destination: city,
        cities: cities,
        days: days,
        travelers: travelers,
        budget: tripData?.budget || 'medium',
        totalSpots: spots.length,
        estimatedCost: {
          tickets: 100 * spots.length * travelers,
          accommodation: 400 * days * Math.ceil(travelers / 2),
          meals: 150 * days * travelers,
          transport: 100 * days,
          other: 200,
          total: 0
        }
      },
      dailyPlan: dailyPlan
    };
    
    plan.summary.estimatedCost.total = 
      plan.summary.estimatedCost.tickets +
      plan.summary.estimatedCost.accommodation +
      plan.summary.estimatedCost.meals +
      plan.summary.estimatedCost.transport +
      plan.summary.estimatedCost.other;

    this.setData({ plan });
  },

  // 计算天数
  calculateDays: function(startDate, endDate) {
    if (!startDate || !endDate) return 3;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  },

  // 添加天数
  addDays: function(dateStr, days) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // 保存到最近行程
  saveToRecentTrips: function(tripData, plan) {
    const recentTrips = wx.getStorageSync('recentTrips') || [];
    
    const newTrip = {
      id: Date.now(),
      name: plan.summary.destination + ' ' + plan.summary.days + '日游',
      destination: plan.summary.destination,
      date: tripData.startDate,
      cover: plan.dailyPlan[0]?.spots[0]?.image || '/images/default.jpg',
      plan: plan
    };

    recentTrips.unshift(newTrip);
    if (recentTrips.length > 10) {
      recentTrips.pop();
    }

    wx.setStorageSync('recentTrips', recentTrips);
  },

  // 保存行程
  onSave: function() {
    wx.showToast({
      title: '行程已保存',
      icon: 'success'
    });
  },

  // 查看地图
  onViewMap: function() {
    wx.navigateTo({
      url: '/pages/map/map'
    });
  }
});
