# 配置文件说明

## 需要配置的 API Key

### 1. MiniMax AI Key（必需）

**云函数环境变量**：`MINIMAX_API_KEY`

获取方式：
1. 访问 https://www.minimaxi.com/
2. 注册账号并创建应用
3. 获取 API Key 和 Group ID

**配置步骤**：
1. 在微信开发者工具中，打开"云开发"控制台
2. 进入"环境变量"设置
3. 添加变量：`MINIMAX_API_KEY`，值为你的 MiniMax API Key

**模型选择**：
- `abab5.5-chat` - 推荐，性价比高
- `abab6-chat` - 更强的理解能力

---

### 2. 高德地图 Key（必需）

**已配置**：
- 小程序 SDK Key: `283d2c6a7ccb59cc152d195eaef2c0db`
- Web服务 API Key: `18de1150066194333cd5a2800770ea9a`

**云函数环境变量**（可选，已硬编码为默认值）：
- 名称：`AMAP_WEB_KEY`
- 值：`18de1150066194333cd5a2800770ea9a`

**配置服务器域名**：
在微信小程序后台 → 开发管理 → 开发设置 → 服务器域名，添加：
- `https://restapi.amap.com`

---

### 3. 微信小程序 AppID

**文件**：`project.config.json`

```json
{
  "appid": "your-app-id"
}
```

---

### 4. 云开发环境 ID

**文件**：`app.js`

```javascript
wx.cloud.init({
  env: 'your-cloud-env-id',
  traceUser: true
});
```

---

## 配置步骤总结

### 第一步：MiniMax 配置
1. 注册 MiniMax 账号
2. 在云开发控制台添加环境变量 `MINIMAX_API_KEY`

### 第二步：高德地图配置
1. 申请高德地图 Key
2. 修改 `utils/amap.js` 中的 `AMAP_KEY`
3. 在小程序后台配置服务器域名

### 第三步：部署云函数
```bash
# 在微信开发者工具中
# 1. 右键 cloud/functions/ai-plan 选择"创建并部署：云端安装依赖"
# 2. 右键 cloud/functions/spot-search 选择"创建并部署：云端安装依赖"
```

### 第四步：创建数据库集合
在云开发控制台 → 数据库，创建以下集合：
- `trips` - 存储行程信息
- `plans` - 存储规划结果
- `spots` - 存储景点数据

### 第五步：导入景点数据（可选）
在 `spots` 集合中导入初始景点数据。

---

## 安全提示

⚠️ **不要将 API Key 提交到 GitHub！**

- MiniMax Key 存储在云函数环境变量中（安全）
- 高德 Key 在小程序前端使用（有一定暴露风险，建议设置域名白名单）

---

## 测试配置

配置完成后，在小程序中测试：
1. 进入行程输入页，填写信息
2. 选择景点
3. 点击"生成规划"
4. 查看是否能正常返回 AI 规划结果

如果报错，检查：
- 云函数日志（云开发控制台 → 云函数 → 日志）
- MiniMax API Key 是否正确
- 高德 Key 是否配置了域名白名单
