# 快速开始：blank-rect 自定义节点

## 1. 节点功能

`blank-rect` 是一个**矩形空白框**节点，用于在画布上标记一个区域，并在配置中保存：

- 背景颜色 `bgColor`
- 宽度 `width`
- 高度 `height`
- 备注说明 `note`

它本身不处理消息（0 输入 / 0 输出），主要作为布局/分组的视觉元素，方便你的外部编排器（例如 React 前端）读取这些元数据。

> 注意：Node-RED 编辑器中节点块的底色主要由节点类型的 `color` 属性决定，单个实例的 `bgColor` 无法完全映射到编辑器内部的渲染颜色，但会保存在 flow JSON 中。

## 2. 如何加载到 Node-RED

下面的方式与 `math-calculator` 的文档类似，你可以任选其一：

### 方法 1：复制到用户目录（开发/测试推荐）

```bash
# 1. 找到 Node-RED 用户目录（默认 ~/.node-red）
cd ~/.node-red

# 2. 创建 nodes 目录（如果不存在）
mkdir -p nodes

# 3. 复制 blank-rect 节点目录
cp -r /path/to/gridstack/react-ai_studio/react-low-code-engine/Orchestrator/custom-nodes/blank-rect ~/.node-red/nodes/

# 4. 重启 Node-RED
node-red   # 或你当前使用的启动命令
```

重启后，打开 `http://localhost:1880`，在左侧面板（通常在 `function` 分类）中应该能看到 `Blank Rect` 节点。

### 方法 2：通过 `nodesDir` 统一加载（适合本项目整体开发）

如果你已经按 `math-calculator/QUICKSTART.md` 中的方式使用 `nodesDir` 指向了 `custom-nodes` 根目录，例如：

```javascript
// settings.js
module.exports = {
  // ...
  nodesDir: '/absolute/path/to/react-low-code-engine/Orchestrator/custom-nodes'
}
```

那么只要保证本目录结构是：

```text
custom-nodes/
  ├── math-calculator/
  └── blank-rect/
```

重启 Node-RED 后，`blank-rect` 会自动被发现并加载。

## 3. 在画布中使用

1. 从左侧面板拖拽 `Blank Rect` 到画布。
2. 双击打开配置：
   - 选择 **背景颜色**（color 选择器）。
   - 设置 **宽度 / 高度**（仅作为元数据）。
   - 填写可选的 **备注说明**。
3. 点击右上角 **部署**。

部署后，通过 Node-RED 的 `/flows` API 或你当前的 React 编排器（`SchemaConfigModal` / `DEFAULT_SCHEMA_JSON`）获取到的节点中，会包含类似：

```json
{
  "id": "blankRect.1",
  "type": "blank-rect",
  "bgColor": "#FFEFD5",
  "width": 240,
  "height": 120,
  "note": "",
  "x": 600,
  "y": 340,
  "wires": []
}
```

你的前端可以用这些字段渲染一个真正有背景色的矩形区域。

