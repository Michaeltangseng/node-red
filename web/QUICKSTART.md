# 快速开始指南

## 前置要求

- Node.js >= 18.5
- Node-RED 已安装并可以运行

## 步骤 1: 安装依赖

```bash
cd web
npm install
```

## 步骤 2: 启动 Node-RED

在项目根目录（`node-red`）下：

```bash
npm start
```

等待 Node-RED 启动完成，通常会在 `http://localhost:1880` 运行。

## 步骤 3: 启动 React 前端

在 `web` 目录下：

```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动。

## 步骤 4: 使用

1. 打开浏览器访问 `http://localhost:3000`
2. 你会看到 Node-RED 编辑器嵌入在页面中
3. 点击右上角的 **"创建流程"** 按钮
4. 等待几秒钟，会显示成功消息
5. 页面会自动刷新，显示新创建的数学计算测试流程

## 测试流程

创建成功后，你会看到一个包含以下节点的流程：

- **Inject 节点**：发送数字 10
- **Math Calculator 节点**：执行加法运算（10 + 5）
- **Debug 节点**：显示结果 15

点击 Inject 节点左侧的按钮来测试流程，结果会在 Debug 面板中显示。

## 故障排除

### 前端无法连接到 Node-RED

- 确保 Node-RED 正在运行（`http://localhost:1880`）
- 检查浏览器控制台是否有错误信息
- 确认 `vite.config.js` 中的代理配置正确

### 创建流程失败

- 检查 Node-RED 是否正常运行
- 查看浏览器控制台的错误信息
- 确认 Node-RED 的 `/flows` API 可以访问

### 流程创建成功但看不到

- 手动刷新页面（F5）
- 检查 Node-RED 编辑器是否正常加载
- 查看 Node-RED 的流程列表

## 下一步

- 修改 `src/App.jsx` 中的 `createTestFlow()` 函数来自定义流程
- 添加更多按钮来创建不同类型的流程
- 自定义 UI 样式和布局
