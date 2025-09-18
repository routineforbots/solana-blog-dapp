import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Polyfill Buffer for browsers
import { Buffer } from 'buffer'
if (!(window as any).Buffer) {
	(window as any).Buffer = Buffer
}

class ErrorBoundary extends Component<{ children?: ReactNode }, { error?: Error }> {
	constructor(props: { children?: ReactNode }) {
		super(props)
		this.state = { error: undefined }
	}
	static getDerivedStateFromError(error: Error) {
		return { error }
	}
	componentDidCatch(error: Error, info: any) {
		console.error('App crashed:', error, info)
	}
	render() {
		if (this.state.error) {
			return (
				<div style={{ padding: 24 }}>
					<h3>Something went wrong</h3>
					<pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error.stack || this.state.error.message || this.state.error)}</pre>
				</div>
			)
		}
		return this.props.children as any
	}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
