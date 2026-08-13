import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { msg: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { msg: null }

  static getDerivedStateFromError(err: Error): State {
    return { msg: err.message }
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error(err, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.msg) {
      return (
        <div style={{ padding: 24, color: '#ff4d6d' }}>
          Ekran patladı: {this.state.msg}
        </div>
      )
    }
    return this.props.children
  }
}
