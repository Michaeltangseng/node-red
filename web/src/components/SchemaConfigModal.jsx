import { useState, useRef, useCallback } from 'react'
import './SchemaConfigModal.css'

// 复杂场景: inject → function → switch → (calculator → debug | debug)，有向无环
const DEFAULT_SCHEMA_JSON = [
  {
    id: "tab.1",
    type: "tab",
    label: "DAG: Inject + Function + Switch + Calculator + Debug",
    disabled: false,
    info: "有向无环: inject → function → switch → calculator/debug"
  },
  {
    id: "inject.1",
    type: "inject",
    z: "tab.1",
    name: "Trigger",
    props: [{ p: "payload" }, { p: "topic", vt: "str" }],
    repeat: "",
    crontab: "",
    once: false,
    onceDelay: 0.1,
    topic: "",
    payload: "10",
    payloadType: "num",
    x: 120,
    y: 200,
    wires: [["function.1"]]
  },
  {
    id: "function.1",
    type: "function",
    z: "tab.1",
    name: "Prepare",
    func: "msg.payload = typeof msg.payload === 'number' ? msg.payload : Number(msg.payload) || 0;\nreturn msg;",
    outputs: 1,
    noerr: 0,
    x: 300,
    y: 200,
    wires: [["switch.1"]]
  },
  {
    id: "switch.1",
    type: "switch",
    z: "tab.1",
    name: "Is number?",
    property: "payload",
    propertyType: "msg",
    rules: [
      { t: "istype", v: "number", vt: "number" },
      { t: "else" }
    ],
    checkall: "false",
    repair: false,
    outputs: 2,
    x: 480,
    y: 200,
    wires: [["math.1"], ["debug.2"]]
  },
  {
    id: "math.1",
    type: "math-calculator",
    z: "tab.1",
    name: "Add 5",
    operation: "add",
    operand1: "payload",
    operand2: "5",
    operand2Type: "num",
    resultProperty: "payload",
    round: false,
    precision: "2",
    x: 680,
    y: 160,
    wires: [["debug.1"]]
  },
  {
    id: "debug.1",
    type: "debug",
    z: "tab.1",
    name: "Calc result",
    active: true,
    tosidebar: true,
    console: false,
    tostatus: false,
    complete: "false",
    statusVal: "",
    statusType: "auto",
    x: 880,
    y: 160,
    wires: []
  },
  {
    id: "debug.2",
    type: "debug",
    z: "tab.1",
    name: "Not number",
    active: true,
    tosidebar: true,
    console: false,
    tostatus: false,
    complete: "false",
    statusVal: "",
    statusType: "auto",
    x: 700,
    y: 240,
    wires: []
  }
]

function SchemaConfigModal({ open, onClose, nodeRedUrl, onApplySuccess }) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(DEFAULT_SCHEMA_JSON, null, 2))
  const [applyMessage, setApplyMessage] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)
  const fileInputRef = useRef(null)

  const getCurrentFlows = useCallback(async () => {
    try {
      const response = await fetch(`${nodeRedUrl}/flows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        return { flows: data.flows || [], rev: data.rev ?? null }
      }
    } catch (e) {
      console.error('获取流程失败:', e)
    }
    return { flows: [], rev: null }
  }, [nodeRedUrl])

  const handleApply = async () => {
    setApplyMessage('')
    setApplyLoading(true)
    try {
      let nodes
      try {
        nodes = JSON.parse(jsonText)
      } catch (e) {
        setApplyMessage('❌ JSON 格式错误: ' + e.message)
        return
      }
      if (!Array.isArray(nodes)) {
        setApplyMessage('❌ Schema 必须是节点数组 (Array)')
        return
      }
      const { flows: existingFlows, rev: currentRev } = await getCurrentFlows()
      const allFlows = [...existingFlows, ...nodes]
      const data = { flows: allFlows }
      if (currentRev != null) data.rev = currentRev

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
        const errText = await response.text()
        throw new Error(`${response.status} - ${errText}`)
      }
      setApplyMessage('✅ 已应用并部署成功')
      onApplySuccess?.()
    } catch (err) {
      setApplyMessage('❌ 应用失败: ' + (err.message || err))
    } finally {
      setApplyLoading(false)
    }
  }

  const handleExportFile = () => {
    const blob = new Blob([jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'node-red-flow-schema.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result
        JSON.parse(text) // validate
        setJsonText(typeof text === 'string' ? text : JSON.stringify(JSON.parse(text), null, 2))
        setApplyMessage('')
      } catch (err) {
        setApplyMessage('❌ 文件不是有效 JSON: ' + err.message)
      }
      e.target.value = ''
    }
    reader.readAsText(file, 'UTF-8')
  }

  if (!open) return null

  return (
    <div className="schema-modal-overlay" onClick={onClose}>
      <div className="schema-modal" onClick={e => e.stopPropagation()}>
        <div className="schema-modal-header">
          <h2>Schema Config</h2>
          <button type="button" className="schema-modal-close" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div className="schema-modal-body">
          <textarea
            className="schema-json-editor"
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            spellCheck={false}
            placeholder='[ { "id": "...", "type": "tab", ... }, ... ]'
          />
        </div>
        <div className="schema-modal-footer">
          <div className="schema-modal-actions">
            <button type="button" className="schema-btn schema-btn-apply" onClick={handleApply} disabled={applyLoading}>
              {applyLoading ? '应用中...' : 'Apply'}
            </button>
            <button type="button" className="schema-btn schema-btn-export" onClick={handleExportFile}>
              Export file
            </button>
            <button type="button" className="schema-btn schema-btn-import" onClick={handleImportFile}>
              Import file
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          {applyMessage && (
            <div className={`schema-apply-message ${applyMessage.startsWith('✅') ? 'success' : 'error'}`}>
              {applyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchemaConfigModal
export { DEFAULT_SCHEMA_JSON }
