import { useEffect, useRef } from 'react'

function NodeRedEditor({ url }) {
  const iframeRef = useRef(null)

  useEffect(() => {
    // iframe 加载完成后的处理
    const handleLoad = () => {
      console.log('Node-RED 编辑器已加载')
    }

    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener('load', handleLoad)
      return () => {
        iframe.removeEventListener('load', handleLoad)
      }
    }
  }, [])

  return (
    <div className="node-red-editor">
      <iframe
        ref={iframeRef}
        src={url}
        title="Node-RED Editor"
        className="node-red-iframe"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

export default NodeRedEditor
