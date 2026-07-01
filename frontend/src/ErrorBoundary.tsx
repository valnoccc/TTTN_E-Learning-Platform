import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: any}> {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{padding: 20, color: 'red', background: 'white', minHeight: '100vh', zIndex: 9999}}>
                    <h1>Error Boundary Caught:</h1>
                    <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{String(this.state.error)}</pre>
                    <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{this.state.error?.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
