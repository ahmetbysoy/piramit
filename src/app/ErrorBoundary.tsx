import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { msg: string | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { msg: null }

  static getDerivedStateFromError(err: Error): State {
    return { msg: err.message }
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error(err, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.msg) {
      return (
        <div className="err-bound">
          <p>Ekran patladı: {this.state.msg}</p>
          <button type="button" onClick={() => this.setState({ msg: null })}>
            Tekrar dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
