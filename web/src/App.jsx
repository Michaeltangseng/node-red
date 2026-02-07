import { useState } from 'react'
import NodeRedEditor from './components/NodeRedEditor'
import SchemaConfigModal from './components/SchemaConfigModal'
import './App.css'

function App() {
  const [nodeRedUrl] = useState('http://localhost:1880')
  const [schemaModalOpen, setSchemaModalOpen] = useState(false)

  const refreshEditor = () => {
    const iframe = document.querySelector('iframe')
    if (iframe) iframe.src = iframe.src
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Node-RED 工作流编辑器</h1>
        <div className="create-flow-container">
          <button
            type="button"
            className="create-flow-button create-flow-button-secondary"
            onClick={() => setSchemaModalOpen(true)}
          >
            schema config
          </button>
          <CreateFlowButton nodeRedUrl={nodeRedUrl} />
        </div>
      </header>
      <main className="app-main">
        <NodeRedEditor url={nodeRedUrl} />
      </main>
      <SchemaConfigModal
        open={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        nodeRedUrl={nodeRedUrl}
        onApplySuccess={refreshEditor}
      />
    </div>
  )
}

function CreateFlowButton({ nodeRedUrl }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9) + '.' + Math.random().toString(36).substr(2, 6)
  }

  // 创建测试流程
  const createTestFlow = () => {
    const tabId = generateId()
    const injectId = generateId()
    const mathId = generateId()
    const debugId = generateId()

    return [
      {
        id: tabId,
        type: "tab",
        label: "Math Calculator Test",
        disabled: false,
        info: "自动生成的数学计算测试流程"
      },
      {
        id: injectId,
        type: "inject",
        z: tabId,
        name: "Test Input",
        props: [{ p: "payload" }, { p: "topic", vt: "str" }],
        repeat: "",
        crontab: "",
        once: false,
        onceDelay: 0.1,
        topic: "",
        payload: "10",
        payloadType: "num",
        x: 240,
        y: 180,
        wires: [[mathId]]
      },
      {
        id: mathId,
        type: "math-calculator",
        z: tabId,
        name: "Add 5",
        operation: "add",
        operand1: "payload",
        operand2: "5",
        operand2Type: "num",
        resultProperty: "payload",
        round: false,
        precision: "2",
        x: 450,
        y: 180,
        wires: [[debugId]]
      },
      {
        id: debugId,
        type: "debug",
        z: tabId,
        name: "Result",
        active: true,
        tosidebar: true,
        console: false,
        tostatus: false,
        complete: "false",
        statusVal: "",
        statusType: "auto",
        x: 660,
        y: 180,
        wires: []
      }
    ]
  }

  // 获取当前流程和版本号
  const getCurrentFlows = async () => {
    try {
      const response = await fetch(`${nodeRedUrl}/flows`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        return {
          flows: data.flows || [],
          rev: data.rev || null
        }
      }
    } catch (error) {
      console.error('获取流程失败:', error)
    }
    return { flows: [], rev: null }
  }

  // 创建并部署流程
  const handleCreateFlow = async () => {
    setLoading(true)
    setMessage('')

    try {
      console.log('🚀 开始创建测试流程...')

      // 获取现有流程
      const { flows: existingFlows, rev: currentRev } = await getCurrentFlows()
      console.log(`📋 现有流程数量: ${existingFlows.length}`)
      console.log('📌 当前版本号:', currentRev)

      // 创建新流程数据
      const newFlow = createTestFlow()
      console.log(`📋 准备添加 ${newFlow.length} 个节点`)

      // 合并现有流程和新流程
      const allFlows = [...existingFlows, ...newFlow]

      // 准备部署数据（使用 v2 API 格式）
      const data = {
        flows: allFlows
      }
      if (currentRev !== null && currentRev !== undefined) {
        data.rev = currentRev
      }

      console.log('📤 通过 HTTP API 发送部署请求...')
      console.log('📊 总流程数量:', allFlows.length)

      // 发送部署请求（使用 v2 API）
      const response = await fetch(`${nodeRedUrl}/flows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Node-RED-Deployment-Type': 'full',
          'Node-RED-API-Version': 'v2'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`部署失败: ${response.status} - ${errorText}`)
      }

      const responseData = await response.json()
      console.log('✅ 部署请求成功!')
      console.log('📌 新版本号:', responseData.rev)

      setMessage('✅ 流程创建并部署成功! 请刷新页面查看新流程。')
      
      // 延迟后刷新 iframe
      setTimeout(() => {
        const iframe = document.querySelector('iframe')
        if (iframe) {
          iframe.src = iframe.src
        }
      }, 1000)

    } catch (error) {
      console.error('❌ 错误:', error)
      setMessage(`❌ 创建流程失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="create-flow-button"
        onClick={handleCreateFlow}
        disabled={loading}
      >
        {loading ? '创建中...' : '创建流程'}
      </button>
      {message && (
        <div className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </>
  )
}

export default App
