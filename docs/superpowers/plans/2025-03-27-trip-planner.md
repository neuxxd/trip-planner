# TripPlanner - AI 智能旅行规划小程序实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一个微信小程序，实现 AI 智能旅行路线规划，支持个性化约束、迭代优化、可视化展示和完整攻略生成。

**Architecture:** 微信小程序前端 + 微信云开发（云函数 + 云数据库）+ 高德地图 SDK + 大模型 API（Kimi）。AI 规划通过云函数调用大模型，地图服务使用高德 SDK。

**Tech Stack:** 微信小程序原生框架, 微信云开发, 高德地图 SDK, Kimi API, JavaScript/TypeScript

---

## 前置检查

- [ ] 确认 `/home/admin/code/trip-planner/` 目录已创建
- [ ] 初始化 Git 仓库
- [ ] 创建 GitHub 远程仓库并关联

---

## Phase 1: 项目初始化

### Task 1: 项目脚手架搭建

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/app.json`
- Create: `/home/admin/code/trip-planner/miniprogram/app.js`
- Create: `/home/admin/code/trip-planner/miniprogram/app.wxss`
- Create: `/home/admin/code/trip-planner/project.config.json`

**Steps:**

- [ ] **Step 1.1: 创建小程序配置文件 app.json**

```json
{
  "pages": [
    "pages/index/index",
    "pages/input/input",
    "pages/spots/spots",
    "pages/plan/plan",
    "pages/map/map",
    "pages/guide/guide"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "TripPlanner",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/plan/plan", "text": "我的行程" }
    ]
  },
  "permission": {
    "scope.userLocation": {
      "desc": "您的位置信息将用于地图展示"
    }
  }
}
```

- [ ] **Step 1.2: 创建 app.js 入口文件**

```javascript
App({
  globalData: {
    userInfo: null,
    currentPlan: null
  },
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'your-cloud-env-id',
      traceUser: true
    })
  }
})
```

- [ ] **Step 1.3: 创建基础样式 app.wxss**

```css
/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

.container {
  padding: 20rpx;
}

.btn-primary {
  background: #07c160;
  color: white;
  border-radius: 8rpx;
}
```

- [ ] **Step 1.4: 创建项目配置文件 project.config.json**

```json
{
  "description": "TripPlanner - AI 智能旅行规划",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.0.0",
  "appid": "your-app-id",
  "projectname": "trip-planner",
  "condition": {}
}
```

- [ ] **Step 1.5: 提交 Git**

```bash
cd /home/admin/code/trip-planner
git add .
git commit -m "feat: 初始化小程序项目结构"
```

---

## Phase 2: 页面开发

### Task 2: 首页 (pages/index/index)

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/pages/index/index.wxml`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/index/index.js`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/index/index.wxss`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/index/index.json`

**Steps:**

- [ ] **Step 2.1: 创建首页 JSON 配置**

```json
{
  "navigationBarTitleText": "TripPlanner",
  "usingComponents": {}
}
```

- [ ] **Step 2.2: 创建首页 WXML 结构**

```html
<view class="container">
  <view class="header">
    <text class="title">AI 智能旅行规划</text>
    <text class="subtitle">输入目的地，让 AI 为你规划完美行程</text>
  </view>
  
  <view class="quick-start">
    <button class="btn-primary" bindtap="goToInput">开始规划</button>
  </view>
  
  <view class="features">
    <view class="feature-item">
      <icon type="success" size="40"/>
      <text>智能路线优化</text>
    </view>
    <view class="feature-item">
      <icon type="success" size="40"/>
      <text>个性化约束</text>
    </view>
    <view class="feature-item">
      <icon type="success" size="40"/>
      <text>可视化地图</text>
    </view>
  </view>
</view>
```

- [ ] **Step 2.3: 创建首页 JS 逻辑**

```javascript
Page({
  data: {
    userInfo: null
  },
  
  onLoad() {
    // 检查是否有进行中的规划
    const currentPlan = wx.getStorageSync('currentPlan')
    if (currentPlan) {
      this.setData({ hasCurrentPlan: true })
    }
  },
  
  goToInput() {
    wx.navigateTo({
      url: '/pages/input/input'
    })
  },
  
  continuePlan() {
    wx.navigateTo({
      url: '/pages/plan/plan'
    })
  }
})
```

- [ ] **Step 2.4: 创建首页样式**

```css
.header {
  text-align: center;
  padding: 60rpx 0;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

.quick-start {
  margin: 40rpx 0;
}

.features {
  display: flex;
  justify-content: space-around;
  margin-top: 60rpx;
}

.feature-item {
  text-align: center;
}

.feature-item text {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
}
```

- [ ] **Step 2.5: 提交 Git**

```bash
git add .
git commit -m "feat: 完成首页开发"
```

---

### Task 3: 行程输入页 (pages/input/input)

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/pages/input/input.wxml`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/input/input.js`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/input/input.wxss`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/input/input.json`

**Steps:**

- [ ] **Step 3.1: 创建输入页 JSON 配置**

```json
{
  "navigationBarTitleText": "行程信息",
  "usingComponents": {}
}
```

- [ ] **Step 3.2: 创建输入页 WXML 结构**

```html
<view class="container">
  <view class="section">
    <view class="section-title">基本信息</view>
    
    <view class="form-item">
      <text class="label">目的地</text>
      <input 
        placeholder="请输入城市名称" 
        value="{{destination}}"
        bindinput="onDestinationInput"
      />
    </view>
    
    <view class="form-item">
      <text class="label">旅行天数</text>
      <picker mode="selector" range="{{dayRange}}" bindchange="onDayChange">
        <view class="picker">{{days || '请选择'}} 天</view>
      </picker>
    </view>
  </view>
  
  <view class="section">
    <view class="section-title">出游类型</view>
    
    <view class="form-item">
      <text class="label">人员</text>
      <radio-group bindchange="onPeopleChange">
        <label><radio value="family" checked/>家庭出游</label>
        <label><radio value="solo"/>个人出游</label>
        <label><radio value="friends"/>朋友结伴</label>
      </radio-group>
    </view>
    
    <view class="form-item">
      <text class="label">距离</text>
      <radio-group bindchange="onDistanceChange">
        <label><radio value="short" checked/>短途/周边</label>
        <label><radio value="long"/>长途</label>
      </radio-group>
    </view>
    
    <view class="form-item">
      <text class="label">节奏</text>
      <radio-group bindchange="onPaceChange">
        <label><radio value="relaxed" checked/>休闲游</label>
        <label><radio value="intensive"/>特种兵</label>
        <label><radio value="deep"/>深度游</label>
      </radio-group>
    </view>
  </view>
  
  <view class="section">
    <view class="section-title">预算约束（可选）</view>
    
    <view class="form-item">
      <text class="label">总预算</text>
      <input 
        type="number"
        placeholder="请输入预算金额" 
        value="{{budget}}"
        bindinput="onBudgetInput"
      />
      <text class="unit">元</text>
    </view>
  </view>
  
  <button class="btn-primary" bindtap="nextStep">下一步：选择景点</button>
</view>
```

- [ ] **Step 3.3: 创建输入页 JS 逻辑**

```javascript
Page({
  data: {
    destination: '',
    days: '',
    dayRange: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    people: 'family',
    distance: 'short',
    pace: 'relaxed',
    budget: ''
  },
  
  onDestinationInput(e) {
    this.setData({ destination: e.detail.value })
  },
  
  onDayChange(e) {
    this.setData({ days: this.data.dayRange[e.detail.value] })
  },
  
  onPeopleChange(e) {
    this.setData({ people: e.detail.value })
  },
  
  onDistanceChange(e) {
    this.setData({ distance: e.detail.value })
  },
  
  onPaceChange(e) {
    this.setData({ pace: e.detail.value })
  },
  
  onBudgetInput(e) {
    this.setData({ budget: e.detail.value })
  },
  
  nextStep() {
    // 验证必填项
    if (!this.data.destination || !this.data.days) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    // 保存到本地存储
    const tripInfo = {
      destination: this.data.destination,
      days: parseInt(this.data.days),
      people: this.data.people,
      distance: this.data.distance,
      pace: this.data.pace,
      budget: this.data.budget ? parseInt(this.data.budget) : null
    }
    wx.setStorageSync('tripInfo', tripInfo)
    
    // 跳转到景点选择页
    wx.navigateTo({
      url: '/pages/spots/spots'
    })
  }
})
```

- [ ] **Step 3.4: 创建输入页样式**

```css
.section {
  background: white;
  margin-bottom: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  border-left: 8rpx solid #07c160;
  padding-left: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

input, .picker {
  border: 2rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

radio-group label {
  display: inline-block;
  margin-right: 30rpx;
  font-size: 28rpx;
}

.unit {
  margin-left: 10rpx;
  font-size: 28rpx;
  color: #666;
}
```

- [ ] **Step 3.5: 提交 Git**

```bash
git add .
git commit -m "feat: 完成行程输入页开发"
```

---

### Task 4: 景点选择页 (pages/spots/spots)

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/pages/spots/spots.wxml`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/spots/spots.js`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/spots/spots.wxss`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/spots/spots.json`

**Steps:**

- [ ] **Step 4.1: 创建景点选择页基础结构**

```json
{
  "navigationBarTitleText": "选择景点",
  "usingComponents": {
    "spot-card": "/components/spot-card/spot-card"
  }
}
```

- [ ] **Step 4.2: 创建景点卡片组件**

```html
<!-- components/spot-card/spot-card.wxml -->
<view class="spot-card {{selected ? 'selected' : ''}}" bindtap="toggleSelect">
  <image class="spot-image" src="{{spot.image}}" mode="aspectFill"/>
  <view class="spot-info">
    <text class="spot-name">{{spot.name}}</text>
    <text class="spot-desc">{{spot.description}}</text>
    <view class="spot-tags">
      <text class="tag" wx:for="{{spot.tags}}" wx:key="index">{{item}}</text>
    </view>
    <text class="spot-price" wx:if="{{spot.price}}">¥{{spot.price}}</text>
  </view>
  <view class="select-icon" wx:if="{{selected}}">✓</view>
</view>
```

- [ ] **Step 4.3: 实现景点搜索和选择逻辑**

```javascript
Page({
  data: {
    destination: '',
    spots: [],
    selectedSpots: [],
    mustVisitSpots: [],
    searchKeyword: ''
  },
  
  onLoad() {
    const tripInfo = wx.getStorageSync('tripInfo')
    this.setData({ destination: tripInfo.destination })
    this.loadSpots(tripInfo.destination)
  },
  
  async loadSpots(destination) {
    // 调用云函数获取景点列表
    const { result } = await wx.cloud.callFunction({
      name: 'spot-search',
      data: { destination }
    })
    this.setData({ spots: result.spots })
  },
  
  onSpotSelect(e) {
    const spot = e.detail
    const selected = this.data.selectedSpots
    const index = selected.findIndex(s => s.id === spot.id)
    
    if (index > -1) {
      selected.splice(index, 1)
    } else {
      selected.push(spot)
    }
    
    this.setData({ selectedSpots: selected })
  },
  
  onMustVisitChange(e) {
    this.setData({ mustVisitSpots: e.detail })
  },
  
  generatePlan() {
    if (this.data.selectedSpots.length === 0) {
      wx.showToast({ title: '请至少选择一个景点', icon: 'none' })
      return
    }
    
    // 保存选中的景点
    wx.setStorageSync('selectedSpots', this.data.selectedSpots)
    wx.setStorageSync('mustVisitSpots', this.data.mustVisitSpots)
    
    // 跳转到规划页
    wx.navigateTo({ url: '/pages/plan/plan' })
  }
})
```

- [ ] **Step 4.4: 提交 Git**

```bash
git add .
git commit -m "feat: 完成景点选择页开发"
```

---

## Phase 3: 云开发后端

### Task 5: 云函数 - AI 规划 (cloud/functions/ai-plan)

**Files:**
- Create: `/home/admin/code/trip-planner/cloud/functions/ai-plan/index.js`
- Create: `/home/admin/code/trip-planner/cloud/functions/ai-plan/package.json`

**Steps:**

- [ ] **Step 5.1: 创建 AI 规划云函数**

```javascript
const cloud = require('wx-server-sdk')
cloud.init()

// Kimi API 配置
const KIMI_API_KEY = 'your-kimi-api-key'
const KIMI_BASE_URL = 'https://api.kimi.com/coding'

exports.main = async (event, context) => {
  const { tripInfo, spots, mustVisitSpots, userFeedback } = event
  
  // 构建 AI Prompt
  const prompt = buildPrompt(tripInfo, spots, mustVisitSpots, userFeedback)
  
  // 调用 Kimi API
  const response = await callKimiAPI(prompt)
  
  // 解析 AI 返回的规划
  const plan = parseAIResponse(response)
  
  return {
    success: true,
    plan: plan
  }
}

function buildPrompt(tripInfo, spots, mustVisitSpots, userFeedback) {
  return `
你是一位专业的旅行规划师。请根据以下信息为用户规划旅行路线：

【基本信息】
- 目的地：${tripInfo.destination}
- 天数：${tripInfo.days}天
- 人员：${tripInfo.people}
- 距离：${tripInfo.distance}
- 节奏：${tripInfo.pace}
${tripInfo.budget ? `- 预算：${tripInfo.budget}元` : ''}

【可选景点】
${spots.map(s => `- ${s.name}：${s.description}，门票¥${s.price || '免费'}，建议游玩${s.duration}小时`).join('\n')}

【必去景点】
${mustVisitSpots.map(s => `- ${s.name}`).join('\n')}

${userFeedback ? `【用户修改意见】\n${userFeedback}` : ''}

请规划每日行程，要求：
1. 合理安排景点顺序，减少交通时间
2. 考虑景点开放时间和建议游玩时长
3. 根据节奏安排每日景点数量
4. 估算每日交通、餐饮、门票费用
5. 提供具体的游玩时间段

返回 JSON 格式：
{
  "days": [
    {
      "day": 1,
      "spots": [{"name": "景点名", "startTime": "09:00", "endTime": "11:00", "duration": 2}],
      "transport": "交通方式和费用",
      "meals": "餐饮建议和费用",
      "totalCost": 500
    }
  ],
  "totalCost": 1500,
  "suggestions": "整体建议"
}
`
}

async function callKimiAPI(prompt) {
  const response = await fetch(`${KIMI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'kimi-for-coding',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  })
  
  const data = await response.json()
  return data.choices[0].message.content
}

function parseAIResponse(response) {
  // 提取 JSON 部分
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  throw new Error('无法解析 AI 响应')
}
```

- [ ] **Step 5.2: 创建 package.json**

```json
{
  "name": "ai-plan",
  "version": "1.0.0",
  "description": "AI 旅行规划云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~3.0.0"
  }
}
```

- [ ] **Step 5.3: 提交 Git**

```bash
git add .
git commit -m "feat: 完成 AI 规划云函数"
```

---

### Task 6: 云函数 - 景点搜索 (cloud/functions/spot-search)

**Files:**
- Create: `/home/admin/code/trip-planner/cloud/functions/spot-search/index.js`

**Steps:**

- [ ] **Step 6.1: 创建景点搜索云函数**

```javascript
const cloud = require('wx-server-sdk')
cloud.init()

// 景点数据库（实际项目中应使用云数据库）
const spotsDB = {
  '北京': [
    { id: 1, name: '故宫', description: '明清皇宫', price: 60, duration: 4, tags: ['历史', '文化'] },
    { id: 2, name: '长城', description: '万里长城', price: 40, duration: 3, tags: ['历史', '户外'] },
    { id: 3, name: '天坛', description: '祭天建筑', price: 15, duration: 2, tags: ['历史', '建筑'] },
    // ...
  ],
  '上海': [
    { id: 10, name: '外滩', description: '万国建筑', price: 0, duration: 2, tags: ['夜景', '建筑'] },
    { id: 11, name: '东方明珠', description: '地标建筑', price: 199, duration: 3, tags: ['观光', '地标'] },
    // ...
  ]
}

exports.main = async (event, context) => {
  const { destination } = event
  
  // 从数据库获取景点
  const spots = spotsDB[destination] || []
  
  return {
    success: true,
    spots: spots
  }
}
```

- [ ] **Step 6.2: 提交 Git**

```bash
git add .
git commit -m "feat: 完成景点搜索云函数"
```

---

## Phase 4: 规划展示与可视化

### Task 7: 规划展示页 (pages/plan/plan)

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/pages/plan/plan.wxml`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/plan/plan.js`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/plan/plan.wxss`

**Steps:**

- [ ] **Step 7.1: 创建规划展示页结构**

```html
<view class="container">
  <view class="plan-header">
    <text class="destination">{{tripInfo.destination}}</text>
    <text class="summary">{{tripInfo.days}}天 · {{plan.totalCost}}元</text>
  </view>
  
  <view class="day-list">
    <view class="day-card" wx:for="{{plan.days}}" wx:key="day">
      <view class="day-header">
        <text class="day-title">第 {{item.day}} 天</text>
        <text class="day-cost">¥{{item.totalCost}}</text>
      </view>
      
      <view class="timeline">
        <view class="spot-item" wx:for="{{item.spots}}" wx:key="name">
          <view class="time">{{item.startTime}} - {{item.endTime}}</view>
          <view class="spot-name">{{item.name}}</view>
          <view class="duration">{{item.duration}}小时</view>
        </view>
      </view>
      
      <view class="day-info">
        <text>交通：{{item.transport}}</text>
        <text>餐饮：{{item.meals}}</text>
      </view>
    </view>
  </view>
  
  <view class="feedback-section">
    <textarea 
      placeholder="对规划不满意？输入修改意见，如：'第一天景点太多，减少一个'"
      value="{{feedback}}"
      bindinput="onFeedbackInput"
    />
    <button class="btn-secondary" bindtap="regeneratePlan">重新规划</button>
  </view>
  
  <view class="actions">
    <button class="btn-primary" bindtap="viewMap">查看地图</button>
    <button class="btn-primary" bindtap="viewGuide">生成攻略</button>
  </view>
</view>
```

- [ ] **Step 7.2: 实现规划展示逻辑**

```javascript
Page({
  data: {
    tripInfo: {},
    plan: {},
    feedback: ''
  },
  
  async onLoad() {
    const tripInfo = wx.getStorageSync('tripInfo')
    const selectedSpots = wx.getStorageSync('selectedSpots')
    const mustVisitSpots = wx.getStorageSync('mustVisitSpots')
    
    this.setData({ tripInfo })
    
    // 调用 AI 规划
    await this.generatePlan(tripInfo, selectedSpots, mustVisitSpots)
  },
  
  async generatePlan(tripInfo, spots, mustVisitSpots, feedback = '') {
    wx.showLoading({ title: 'AI 规划中...' })
    
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'ai-plan',
        data: {
          tripInfo,
          spots,
          mustVisitSpots,
          userFeedback: feedback
        }
      })
      
      this.setData({ plan: result.plan })
      wx.setStorageSync('currentPlan', result.plan)
    } catch (error) {
      wx.showToast({ title: '规划失败，请重试', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  
  onFeedbackInput(e) {
    this.setData({ feedback: e.detail.value })
  },
  
  async regeneratePlan() {
    if (!this.data.feedback) {
      wx.showToast({ title: '请输入修改意见', icon: 'none' })
      return
    }
    
    const tripInfo = wx.getStorageSync('tripInfo')
    const selectedSpots = wx.getStorageSync('selectedSpots')
    const mustVisitSpots = wx.getStorageSync('mustVisitSpots')
    
    await this.generatePlan(tripInfo, selectedSpots, mustVisitSpots, this.data.feedback)
    this.setData({ feedback: '' })
  },
  
  viewMap() {
    wx.navigateTo({ url: '/pages/map/map' })
  },
  
  viewGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' })
  }
})
```

- [ ] **Step 7.3: 提交 Git**

```bash
git add .
git commit -m "feat: 完成规划展示页开发"
```

---

### Task 8: 地图可视化页 (pages/map/map)

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/pages/map/map.wxml`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/map/map.js`

**Steps:**

- [ ] **Step 8.1: 创建地图页面**

```html
<view class="container">
  <map 
    id="tripMap"
    longitude="{{longitude}}"
    latitude="{{latitude}}"
    scale="12"
    markers="{{markers}}"
    polyline="{{polyline}}"
    show-location
    style="width: 100%; height: 100vh;"
  />
  
  <view class="map-controls">
    <picker mode="selector" range="{{dayOptions}}" bindchange="onDayChange">
      <view class="day-selector">{{currentDay}}</view>
    </picker>
  </view>
</view>
```

- [ ] **Step 8.2: 实现地图逻辑**

```javascript
Page({
  data: {
    longitude: 116.4074,
    latitude: 39.9042,
    markers: [],
    polyline: [],
    dayOptions: ['全部', '第1天', '第2天', '第3天'],
    currentDay: '全部'
  },
  
  onLoad() {
    const plan = wx.getStorageSync('currentPlan')
    this.renderRoute(plan)
  },
  
  renderRoute(plan, dayFilter = '全部') {
    const days = dayFilter === '全部' 
      ? plan.days 
      : plan.days.filter(d => d.day === parseInt(dayFilter.replace('第', '').replace('天', '')))
    
    const markers = []
    const points = []
    
    days.forEach(day => {
      day.spots.forEach((spot, index) => {
        // 这里需要调用高德地图 API 获取坐标
        markers.push({
          id: index,
          latitude: spot.latitude,
          longitude: spot.longitude,
          title: spot.name,
          iconPath: '/images/marker.png',
          width: 30,
          height: 30
        })
        
        points.push({
          latitude: spot.latitude,
          longitude: spot.longitude
        })
      })
    })
    
    this.setData({
      markers,
      polyline: [{
        points,
        color: '#07c160',
        width: 4
      }]
    })
  },
  
  onDayChange(e) {
    const day = this.data.dayOptions[e.detail.value]
    this.setData({ currentDay: day })
    
    const plan = wx.getStorageSync('currentPlan')
    this.renderRoute(plan, day)
  }
})
```

- [ ] **Step 8.3: 提交 Git**

```bash
git add .
git commit -m "feat: 完成地图可视化页开发"
```

---

## Phase 5: 完整攻略生成

### Task 9: 攻略页 (pages/guide/guide)

**Files:**
- Create: `/home/admin/code/trip-planner/miniprogram/pages/guide/guide.wxml`
- Create: `/home/admin/code/trip-planner/miniprogram/pages/guide/guide.js`

**Steps:**

- [ ] **Step 9.1: 创建攻略页面**

```html
<view class="container">
  <view class="guide-header">
    <text class="guide-title">{{tripInfo.destination}} 旅行攻略</text>
    <text class="guide-meta">{{tripInfo.days}}天 {{tripInfo.people}} {{tripInfo.pace}}游</text>
  </view>
  
  <view class="guide-content">
    <view class="section" wx:for="{{guideSections}}" wx:key="title">
      <view class="section-title">{{item.title}}</view>
      <rich-text nodes="{{item.content}}"/>
    </view>
  </view>
  
  <button class="btn-primary" bindtap="shareGuide">分享攻略</button>
</view>
```

- [ ] **Step 9.2: 实现攻略生成逻辑**

```javascript
Page({
  data: {
    tripInfo: {},
    guideSections: []
  },
  
  async onLoad() {
    const tripInfo = wx.getStorageSync('tripInfo')
    const plan = wx.getStorageSync('currentPlan')
    
    this.setData({ tripInfo })
    await this.generateGuide(tripInfo, plan)
  },
  
  async generateGuide(tripInfo, plan) {
    wx.showLoading({ title: '生成攻略中...' })
    
    // 调用云函数生成完整攻略
    const { result } = await wx.cloud.callFunction({
      name: 'ai-plan',
      data: {
        type: 'guide',
        tripInfo,
        plan
      }
    })
    
    this.setData({ guideSections: result.guide })
    wx.hideLoading()
  },
  
  shareGuide() {
    // 生成分享图或链接
    wx.showShareMenu({
      withShareTicket: true
    })
  }
})
```

- [ ] **Step 9.3: 提交 Git**

```bash
git add .
git commit -m "feat: 完成攻略页开发"
```

---

## Phase 6: 高德地图集成

### Task 10: 高德地图 SDK 集成

**Files:**
- Modify: `/home/admin/code/trip-planner/miniprogram/utils/amap.js`

**Steps:**

- [ ] **Step 10.1: 创建高德地图工具类**

```javascript
// utils/amap.js
const AMAP_KEY = 'your-amap-key'

class AMapService {
  // 地理编码：地址转坐标
  async geocode(address) {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(address)}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1' && data.geocodes.length > 0) {
      const location = data.geocodes[0].location.split(',')
      return {
        longitude: parseFloat(location[0]),
        latitude: parseFloat(location[1])
      }
    }
    throw new Error('地理编码失败')
  }
  
  // 计算两点间距离和路线
  async calculateRoute(origin, destination, mode = 'driving') {
    const url = `https://restapi.amap.com/v3/direction/${mode}?key=${AMAP_KEY}&origin=${origin}&destination=${destination}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1') {
      const route = data.route.paths[0]
      return {
        distance: parseInt(route.distance), // 米
        duration: parseInt(route.duration), // 秒
        steps: route.steps
      }
    }
    throw new Error('路线计算失败')
  }
  
  // 批量计算多景点间距离矩阵
  async calculateDistanceMatrix(origins, destinations) {
    const originsStr = origins.map(o => `${o.longitude},${o.latitude}`).join('|')
    const destinationsStr = destinations.map(d => `${d.longitude},${d.latitude}`).join('|')
    
    const url = `https://restapi.amap.com/v3/distance?key=${AMAP_KEY}&origins=${originsStr}&destination=${destinationsStr}&type=1`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1') {
      return data.results.map(r => ({
        distance: parseInt(r.distance),
        duration: parseInt(r.duration)
      }))
    }
    throw new Error('距离矩阵计算失败')
  }
}

module.exports = new AMapService()
```

- [ ] **Step 10.2: 提交 Git**

```bash
git add .
git commit -m "feat: 集成高德地图 SDK"
```

---

## Phase 7: 测试与优化

### Task 11: 功能测试

**Steps:**

- [ ] **Step 11.1: 测试首页和输入页**
- [ ] **Step 11.2: 测试景点选择和 AI 规划**
- [ ] **Step 11.3: 测试规划展示和迭代优化**
- [ ] **Step 11.4: 测试地图可视化**
- [ ] **Step 11.5: 测试攻略生成**

### Task 12: 性能优化

**Steps:**

- [ ] **Step 12.1: 优化图片加载**
- [ ] **Step 12.2: 添加加载状态**
- [ ] **Step 12.3: 错误处理和重试机制**

### Task 13: 提交 Git 并推送 GitHub

```bash
git add .
git commit -m "feat: 完成所有功能开发和测试"
git push origin main
```

---

## 部署上线

### 微信小程序部署

- [ ] 注册微信小程序账号
- [ ] 配置服务器域名（高德地图 API）
- [ ] 上传代码并提交审核
- [ ] 配置云开发环境

---

## 总结

| 阶段 | 主要工作 | 预估时间 |
|------|---------|---------|
| Phase 1 | 项目初始化 | 30分钟 |
| Phase 2 | 页面开发 | 2小时 |
| Phase 3 | 云函数开发 | 1.5小时 |
| Phase 4 | 规划展示与地图 | 1.5小时 |
| Phase 5 | 攻略生成 | 1小时 |
| Phase 6 | 高德地图集成 | 1小时 |
| Phase 7 | 测试与优化 | 1小时 |
| **总计** | | **约 8-10 小时** |

---

**计划已创建完成！** 保存在 `/home/admin/code/trip-planner/docs/superpowers/plans/2025-03-27-trip-planner.md`

现在开始执行开发吗？