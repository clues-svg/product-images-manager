import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ff4d4f' }}>出错了 (Something went wrong)</h1>
          <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '4px', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Error:</h3>
            <pre style={{ color: '#ff4d4f' }}>{this.state.error && this.state.error.toString()}</pre>
            <h3>Component Stack:</h3>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '8px 16px', cursor: 'pointer' }}
          >
            刷新页面 (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;