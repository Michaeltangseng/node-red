# 自动创建测试流程指南

本目录提供了多种方式来自动创建包含 `inject` → `Math Calculator` → `debug` 节点的测试流程。

## 🚀 快速开始

### 方法1: 浏览器控制台（最简单，推荐）

1. **启动 Node-RED** 并打开编辑器（http://localhost:1880）

2. **打开浏览器开发者工具**
   - 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

3. **切换到 Console 标签页**

4. **运行脚本**
   - 打开 `auto-create-browser.js` 文件
   - 复制全部内容
   - 粘贴到浏览器控制台
   - 按 Enter 执行

5. **完成！** 
   - 流程会自动创建并显示在编辑器中
   - 会自动切换到新创建的流程标签页

**提示**: 脚本会创建一个名为 "Math Calculator Test" 的流程，包含：
- `inject` 节点（输入值：10）
- `math-calculator` 节点（加法运算，加5）
- `debug` 节点（显示结果）

### 方法2: 命令行脚本

使用 Node.js 脚本通过 HTTP API 创建流程：

```bash
# 基本用法
node create-test-flow.js

# 指定 Node-RED 地址
node create-test-flow.js --url http://localhost:1880

# 如果需要认证
node create-test-flow.js --url http://localhost:1880 --user admin --pass password

# 指定流程ID（添加到现有流程）
node create-test-flow.js --flow-id existing-flow-id
```

### 方法3: HTTP API (curl)

使用 curl 命令直接调用 Node-RED API：

```bash
curl -X POST http://localhost:1880/flows \
  -H "Content-Type: application/json" \
  -H "Node-RED-Deployment-Type: full" \
  -d @test-flow.json
```

其中 `test-flow.json` 包含流程配置（见下方示例）。

### 方法4: HTTP API (JavaScript/Node.js)

```javascript
const http = require('http');

const flowConfig = {
  flows: [
    {
      id: "test-tab-001",
      type: "tab",
      label: "Math Calculator Test",
      disabled: false
    },
    {
      id: "inject-001",
      type: "inject",
      z: "test-tab-001",
      name: "Test Input",
      props: [{"p": "payload"}],
      payload: "10",
      payloadType: "num",
      x: 240,
      y: 180,
      wires: [["math-001"]]
    },
    {
      id: "math-001",
      type: "math-calculator",
      z: "test-tab-001",
      name: "Add 5",
      operation: "add",
      operand1: "payload",
      operand2: "5",
      operand2Type: "num",
      resultProperty: "payload",
      x: 450,
      y: 180,
      wires: [["debug-001"]]
    },
    {
      id: "debug-001",
      type: "debug",
      z: "test-tab-001",
      name: "Result",
      active: true,
      tosidebar: true,
      x: 660,
      y: 180,
      wires: []
    }
  ]
};

const options = {
  hostname: 'localhost',
  port: 1880,
  path: '/flows',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Node-RED-Deployment-Type': 'full'
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  if (res.statusCode === 204) {
    console.log('✅ 流程创建成功!');
  }
});

req.on('error', (e) => {
  console.error(`❌ 错误: ${e.message}`);
});

req.write(JSON.stringify(flowConfig));
req.end();
```

## 📝 流程配置说明

自动创建的流程包含以下节点：

### 1. Tab 节点
- **类型**: `tab`
- **标签**: "Math Calculator Test"
- **作用**: 创建新的流程标签页

### 2. Inject 节点
- **类型**: `inject`
- **名称**: "Test Input"
- **配置**: 
  - `payload`: `10` (数字类型)
  - `once`: `false` (不自动触发)
- **位置**: x=240, y=180

### 3. Math Calculator 节点
- **类型**: `math-calculator`
- **名称**: "Add 5"
- **配置**:
  - `operation`: `add` (加法)
  - `operand1`: `payload` (从消息的 payload 获取)
  - `operand2`: `5` (固定值)
  - `operand2Type`: `num` (数字类型)
  - `resultProperty`: `payload` (结果存储到 payload)
- **位置**: x=450, y=180

### 4. Debug 节点
- **类型**: `debug`
- **名称**: "Result"
- **配置**:
  - `active`: `true` (启用)
  - `tosidebar`: `true` (输出到侧边栏)
- **位置**: x=660, y=180

## 🔧 自定义配置

### 修改节点类型

在浏览器控制台脚本中，可以修改 `createTestFlow()` 函数来创建不同的节点组合：

```javascript
// 例如：创建更复杂的流程
const newFlow = [
    // ... tab 节点 ...
    {
        id: injectId,
        type: "inject",
        // ... 配置 ...
        payload: "100",  // 修改输入值
        // ...
    },
    {
        id: mathId,
        type: "math-calculator",
        // ... 配置 ...
        operation: "multiply",  // 改为乘法
        operand2: "2",          // 乘以2
        // ...
    },
    // ... debug 节点 ...
];
```

### 修改节点位置

调整 `x` 和 `y` 坐标来改变节点在画布上的位置：

```javascript
{
    x: 240,  // 水平位置
    y: 180,  // 垂直位置
}
```

### 修改连接关系

通过 `wires` 数组来定义节点之间的连接：

```javascript
{
    wires: [[targetNodeId]]  // 连接到目标节点
}
```

## 🐛 故障排除

### 浏览器控制台方法

**问题**: 脚本执行后没有反应
- **解决**: 确保在 Node-RED 编辑器中运行脚本，而不是在普通网页
- **检查**: 确认 `RED` 对象存在：在控制台输入 `typeof RED`，应该返回 `"object"`

**问题**: 提示 "Node-RED 编辑器未加载"
- **解决**: 刷新页面，等待编辑器完全加载后再运行脚本

### 命令行脚本方法

**问题**: 连接被拒绝
- **解决**: 确保 Node-RED 正在运行
- **检查**: 访问 http://localhost:1880 确认服务可用

**问题**: 认证失败
- **解决**: 如果 Node-RED 启用了认证，需要提供正确的用户名和密码
- **使用**: `--user` 和 `--pass` 参数

### HTTP API 方法

**问题**: 401 未授权
- **解决**: 如果启用了认证，需要在请求头中添加认证信息
- **示例**: 
  ```bash
  curl -X POST http://localhost:1880/flows \
    -u username:password \
    -H "Content-Type: application/json" \
    -d @test-flow.json
  ```

**问题**: 400 错误请求
- **解决**: 检查 JSON 格式是否正确
- **检查**: 使用 JSON 验证工具验证流程配置

## 📚 相关文件

- `auto-create-browser.js` - 浏览器控制台脚本
- `create-test-flow.js` - 命令行脚本
- `QUICKSTART.md` - 快速开始指南

## 💡 提示

- 自动创建的流程会添加到现有流程中，不会覆盖已有流程
- 如果多次运行脚本，会创建多个相同的流程
- 可以通过编辑器的"删除"功能删除不需要的流程
- 建议在测试环境中使用，生产环境请谨慎操作
