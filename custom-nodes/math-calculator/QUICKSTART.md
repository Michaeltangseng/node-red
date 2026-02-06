# 快速开始指南

## 如何加载自定义节点到 Node-RED

### 方法1: 复制到用户目录（推荐用于开发测试）

1. **找到 Node-RED 用户目录**
   - 默认位置：`~/.node-red/` (Linux/Mac) 或 `%USERPROFILE%\.node-red\` (Windows)
   - 如果使用自定义用户目录，使用 `--userDir` 参数指定的目录

2. **创建 nodes 文件夹（如果不存在）**
   ```bash
   mkdir -p ~/.node-red/nodes
   ```

3. **复制节点文件夹**
   ```bash
   cp -r /path/to/node-red/custom-nodes/math-calculator ~/.node-red/nodes/
   ```

4. **重启 Node-RED**
   - 停止当前运行的 Node-RED（Ctrl+C）
   - 重新启动：`node-red` 或 `npm start`

5. **验证节点加载**
   - 打开 Node-RED 编辑器（通常是 http://localhost:1880）
   - 在左侧面板的 "function" 分类下应该能看到 "Math Calculator" 节点

### 方法2: 使用 nodesDir 配置（开发环境）

如果你在开发环境中，可以通过设置 `nodesDir` 来指定节点目录：

1. **创建或编辑 settings.js**
   ```bash
   # 在 Node-RED 用户目录下
   cp settings.js settings.js.backup  # 备份
   ```

2. **编辑 settings.js，添加 nodesDir 配置**
   ```javascript
   module.exports = {
       // ... 其他配置
       nodesDir: '/absolute/path/to/node-red/custom-nodes'
   }
   ```

3. **重启 Node-RED**

### 方法3: 通过 npm 链接（开发时推荐）

如果你在开发节点，可以使用 npm link：

1. **在节点目录中创建链接**
   ```bash
   cd /path/to/node-red/custom-nodes/math-calculator
   npm link
   ```

2. **在 Node-RED 用户目录中链接**
   ```bash
   cd ~/.node-red
   npm link node-red-contrib-math-calculator
   ```

3. **重启 Node-RED**

## 测试节点

### 基本测试流程

#### 方法1: 手动创建（传统方式）

1. **创建测试流程**
   - 拖拽一个 `inject` 节点到画布
   - 拖拽 `Math Calculator` 节点到画布
   - 拖拽一个 `debug` 节点到画布

2. **连接节点**
   - `inject` → `Math Calculator` → `debug`

#### 方法2: 自动创建流程（推荐）

使用提供的脚本自动创建测试流程：

**使用命令行脚本：**
```bash
# 在 math-calculator 目录下运行
node create-test-flow.js

# 或者指定 Node-RED 地址
node create-test-flow.js --url http://localhost:1880

# 如果需要认证
node create-test-flow.js --url http://localhost:1880 --user admin --pass password
```

**使用浏览器控制台（最简单的方式）：**
1. 打开 Node-RED 编辑器（http://localhost:1880）
2. 按 F12 打开开发者工具
3. 在 Console 标签页中运行以下代码：

```javascript
// 方式1: 直接运行脚本（推荐）
fetch('/custom-nodes/math-calculator/auto-create-browser.js')
  .then(r => r.text())
  .then(eval)
  .catch(() => {
    // 如果文件不存在，使用内联代码
    // 复制 auto-create-browser.js 文件内容到控制台运行
    console.log('请复制 auto-create-browser.js 文件内容到控制台运行');
  });

// 方式2: 手动复制代码
// 打开 auto-create-browser.js 文件，复制全部内容到控制台运行
```

或者直接复制 `auto-create-browser.js` 文件的全部内容到浏览器控制台运行。

**使用 HTTP API（curl）：**
```bash
curl -X POST http://localhost:1880/flows \
  -H "Content-Type: application/json" \
  -H "Node-RED-Deployment-Type: full" \
  -d @- << 'EOF'
{
  "flows": [
    {
      "id": "test-tab-001",
      "type": "tab",
      "label": "Math Calculator Test",
      "disabled": false
    },
    {
      "id": "inject-001",
      "type": "inject",
      "z": "test-tab-001",
      "name": "Test Input",
      "props": [{"p": "payload"}],
      "payload": "10",
      "payloadType": "num",
      "x": 240,
      "y": 180,
      "wires": [["math-001"]]
    },
    {
      "id": "math-001",
      "type": "math-calculator",
      "z": "test-tab-001",
      "name": "Add 5",
      "operation": "add",
      "operand1": "payload",
      "operand2": "5",
      "operand2Type": "num",
      "resultProperty": "payload",
      "x": 450,
      "y": 180,
      "wires": [["debug-001"]]
    },
    {
      "id": "debug-001",
      "type": "debug",
      "z": "test-tab-001",
      "name": "Result",
      "active": true,
      "tosidebar": true,
      "x": 660,
      "y": 180,
      "wires": []
    }
  ]
}
EOF
```

3. **配置节点**
   - 双击 `inject` 节点，设置 `payload` 为数字，如 `10`
   - 双击 `Math Calculator` 节点：
     - 运算类型：选择 "加法 (+)"
     - 操作数1：保持默认 `payload`
     - 操作数2：输入 `5`
     - 其他保持默认
   - 点击 "完成"

4. **部署和测试**
   - 点击右上角 "部署" 按钮
   - 点击 `inject` 节点左侧的按钮触发
   - 在右侧 Debug 面板查看结果，应该看到 `payload: 15`

### 测试不同运算类型

- **减法**: 操作数1=10, 操作数2=3 → 结果=7
- **乘法**: 操作数1=5, 操作数2=4 → 结果=20
- **除法**: 操作数1=15, 操作数2=3 → 结果=5
- **幂运算**: 操作数1=2, 操作数2=8 → 结果=256
- **平方根**: 操作数1=16, 操作数2=忽略 → 结果=4

## 故障排除

### 节点没有出现在面板中

1. **检查文件结构**
   - 确保 `math-calculator.js` 和 `math-calculator.html` 在同一目录
   - 确保 `package.json` 存在且配置正确

2. **检查 Node-RED 日志**
   - 查看启动日志中是否有错误信息
   - 查找类似 "Loading node: math-calculator" 的消息

3. **清除缓存**
   ```bash
   # 删除 Node-RED 的缓存
   rm -rf ~/.node-red/.config.json
   # 重启 Node-RED
   ```

### 节点配置面板不显示

1. **检查 HTML 文件语法**
   - 确保 HTML 文件格式正确
   - 检查是否有 JavaScript 语法错误

2. **查看浏览器控制台**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签页中的错误信息

### 节点执行出错

1. **检查输入数据**
   - 确保操作数是有效数字
   - 检查消息属性路径是否正确

2. **查看节点日志**
   - 在 Node-RED 编辑器中查看节点状态
   - 检查 Debug 面板中的错误消息

## 下一步

- 查看 [README.md](README.md) 了解完整功能
- 尝试不同的配置选项
- 创建更复杂的流程来测试节点功能
