import { Component } from 'react';

// Catches unexpected rendering errors so the user sees a message instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="container section">
        <div className="state state-error" role="alert">
          <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Something went wrong</h1>
          <p>An unexpected error occurred while showing this page.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.assign('/')}>
            Go to home page
          </button>
        </div>
      </div>
    );
  }
}
