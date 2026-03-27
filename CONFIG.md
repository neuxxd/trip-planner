# 配置文件说明

## 需要配置的 API Key

### 1. 高德地图 Key
文件：`utils/amap.js`
```javascript
const AMAP_KEY = 'YOUR_AMAP_KEY';
```
获取方式：
1. 访问 https://lbs.amap.com/
2. 注册账号并创建应用
3. 申请 Web服务 Key
4. 在微信小程序后台配置服务器域名：
   - https://restapi.amap.com

### 2. AI API Key
文件：`utils/ai.js`
```javascript
const AI_CONFIG = {
  baseURL: 'https://api.kimi.com/coding/',
  apiKey: 'YOUR_API_KEY',
  model: 'kimi-for-coding'
};
```
可选的 AI 服务：
- **Kimi**: https://platform.moonshot.cn/
- **OpenAI**: https://platform.openai.com/
- **文心一言**: https://cloud.baidu.com/
- **智谱 AI**: https://open.bigmodel.cn/

### 3. 微信小程序 AppID
文件：`project.config.json`
```json
{
  "appid": "your-app-id"
}
```

### 4. 云开发环境 ID
文件：`app.js`
```javascript
wx.cloud.init({
  env: 'your-cloud-env-id',
  traceUser: true
});
```

## 配置步骤

1. 复制本文件为 `config.js`
2. 填入你的真实 API Key
3. 在微信小程序后台配置服务器域名
4. 部署云函数
5. 编译运行

## 安全提示

⚠️ **不要将包含真实 API Key 的代码提交到 GitHub！**

建议：
- 使用环境变量存储敏感信息
- 在 `.gitignore` 中排除 `config.js`
- 云函数中使用 `wx-server-sdk` 的环境变量功能
