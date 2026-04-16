"use client";

import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Chart rendering error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 text-center p-4">
                    <p className="font-bold">Chart Rendering Failed</p>
                    <p className="text-sm">There was an error while trying to display the chart. Please check the console for details.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;