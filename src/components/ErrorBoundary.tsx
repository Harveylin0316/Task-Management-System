import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 520,
            lineHeight: 1.6,
          }}
        >
          <h1 style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            畫面載入時發生錯誤
          </h1>
          <pre
            style={{
              background: '#f5f4ef',
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
              overflow: 'auto',
            }}
          >
            {this.state.error.message}
          </pre>
          <p style={{ fontSize: 14, color: '#555', marginTop: 16 }}>
            請試著用終端機在專案目錄執行 <code>npm run dev</code>，再以
            http://localhost:5173 開啟。若曾匯入 JSON，可清除此網站的
            localStorage 後重新整理。
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
