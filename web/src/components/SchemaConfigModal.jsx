import { useState, useRef, useCallback, useEffect } from 'react'
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

const FLOWS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Node-RED-API-Version': 'v2'
}

function SchemaConfigModal({ open, onClose, nodeRedUrl, apiBaseUrl, onApplySuccess }) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(DEFAULT_SCHEMA_JSON, null, 2))
  const [message, setMessage] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const fileInputRef = useRef(null)

  const flowsUrl = (typeof apiBaseUrl === 'string' ? apiBaseUrl : nodeRedUrl || '').replace(/\/$/, '') || ''
  const flowsEndpoint = flowsUrl ? `${flowsUrl}/flows` : '/flows'

  const getCurrentFlows = useCallback(async () => {
    try {
      const res = await fetch(flowsEndpoint, { method: 'GET', headers: FLOWS_HEADERS })
      if (!res.ok) return { flows: [], rev: null }
      const data = await res.json()
      const flows = Array.isArray(data) ? data : (data?.flows ?? [])
      const rev = Array.isArray(data) ? null : (data?.rev ?? null)
      return { flows, rev }
    } catch (e) {
      console.error('获取流程失败:', e)
      return { flows: [], rev: null }
    }
  }, [flowsEndpoint])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSyncLoading(true)
    setMessage('')
    getCurrentFlows()
      .then(({ flows }) => {
        if (!cancelled) setJsonText(JSON.stringify(flows, null, 2))
      })
      .catch(() => {
        if (!cancelled) setMessage('❌ 同步画布失败，请检查 Node-RED 是否运行')
      })
      .finally(() => {
        if (!cancelled) setSyncLoading(false)
      })
    return () => { cancelled = true }
  }, [open, getCurrentFlows])

  const handleApply = async () => {
    setMessage('')
    setApplyLoading(true)
    try {
      const flows = JSON.parse(jsonText)
      if (!Array.isArray(flows)) {
        setMessage('❌ Schema 必须是节点数组 (Array)')
        return
      }
      const { rev } = await getCurrentFlows()
      const body = { flows, ...(rev != null && { rev }) }
      const res = await fetch(flowsEndpoint, {
        method: 'POST',
        headers: { ...FLOWS_HEADERS, 'Node-RED-Deployment-Type': 'full' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`${res.status} - ${await res.text()}`)
      onApplySuccess?.()
      onClose()
    } catch (err) {
      const msg = err instanceof SyntaxError ? '❌ JSON 格式错误: ' + err.message : '❌ 应用失败: ' + (err.message || err)
      setMessage(msg)
    } finally {
      setApplyLoading(false)
    }
  }

  const handleExport = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([jsonText], { type: 'application/json' }))
    a.download = 'node-red-flow-schema.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        setJsonText(JSON.stringify(JSON.parse(text), null, 2))
        setMessage('')
      } catch (err) {
        setMessage('❌ 文件不是有效 JSON: ' + err.message)
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
          {syncLoading && <div className="schema-sync-loading">正在从画布同步…</div>}
          <textarea
            className="schema-json-editor"
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            spellCheck={false}
            placeholder='[ { "id": "...", "type": "tab", ... }, ... ]'
            readOnly={syncLoading}
          />
        </div>
        <div className="schema-modal-footer">
          <div className="schema-modal-actions">
            <button type="button" className="schema-btn schema-btn-apply" onClick={handleApply} disabled={applyLoading}>
              {applyLoading ? '应用中...' : 'Apply'}
            </button>
            <button type="button" className="schema-btn" onClick={handleExport}>Export file</button>
            <button type="button" className="schema-btn" onClick={() => fileInputRef.current?.click()}>Import file</button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={onFileChange} style={{ display: 'none' }} />
          {message && (
            <div className={`schema-apply-message ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SchemaConfigModal
export { DEFAULT_SCHEMA_JSON }
