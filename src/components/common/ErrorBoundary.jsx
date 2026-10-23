import { Component } from 'react'

// Catches uncaught render errors anywhere in the routed content and shows a
// friendly recovery prompt instead of a blank screen. Class component because
// error boundaries have no function-component equivalent yet in React 19.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h1>Something went wrong</h1>
          <p>
            An unexpected error interrupted this page. Reloading usually clears it &mdash; if it
            keeps happening, let us know.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
