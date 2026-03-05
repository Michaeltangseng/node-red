# Node-RED React 前端包装器

这是 React 前端应用，用于包裹 Node-RED 编辑器。

## 功能

- ✅ 在 React 应用中嵌入 Node-RED 编辑器（通过 iframe）
- ✅ 点击"创建流程"按钮自动创建数学计算测试流程
- ✅ 自动部署流程到 Node-RED

## 快速开始

### 1. 安装依赖

```bash
cd web
npm install
```

### 2. 启动 Node-RED（如果尚未启动）

在项目根目录下：

```bash
npm start
```

Node-RED 将在 `http://localhost:1880` 启动

### 3. 启动 React 前端

```bash
cd web
npm run dev
```

前端将在 `http://localhost:3000` 启动

### 4. 使用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击右上角的"创建流程"按钮
3. 等待流程创建完成（会显示成功消息）
4. 页面会自动刷新，显示新创建的流程

## 项目结构

```
web/
├── src/
│   ├── components/
│   │   └── NodeRedEditor.jsx    # Node-RED iframe 组件
│   ├── App.jsx                   # 主应用组件（包含创建流程逻辑）
│   ├── App.css                   # 应用样式
│   ├── main.jsx                  # React 入口文件
│   └── index.css                 # 全局样式
├── index.html                    # HTML 模板
├── package.json                  # 项目配置
├── vite.config.js               # Vite 配置（包含代理设置）
└── readme.md                     # 本文件
```

## 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具和开发服务器
- **Node-RED API** - 通过 HTTP API 创建和部署流程

## 工作原理

1. **嵌入 Node-RED**：通过 iframe 嵌入 Node-RED 编辑器（`http://localhost:1880`）
2. **创建流程**：点击按钮时，调用 Node-RED 的 `/flows` API
3. **流程数据**：使用与 `auto-create-browser.js` 相同的流程定义
4. **自动部署**：流程创建后自动部署，并刷新 iframe 显示新流程

## 配置

### 修改 Node-RED 地址

在 `src/App.jsx` 中修改：

```javascript
const [nodeRedUrl] = useState('http://localhost:1880')
```

### 修改代理配置

如果需要修改 API 代理，编辑 `vite.config.js` 中的 `proxy` 配置。

## 开发

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 注意事项

- 确保 Node-RED 在 `http://localhost:1880` 运行
- 如果 Node-RED 需要认证，可能需要添加认证头
- 创建流程后，iframe 会自动刷新以显示新流程