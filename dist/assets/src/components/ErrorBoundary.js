import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false, errorMessage: "" };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error.message };
    }
    componentDidCatch(error, info) {
        console.warn("ErrorBoundary caught:", error.message, info.componentStack);
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (_jsxs("div", { className: "simulation-wrap", style: { display: "grid", placeItems: "center", padding: "32px", textAlign: "center" }, children: [_jsx("p", { style: { color: "#fb7185", fontWeight: 800, margin: "0 0 8px" }, children: "3D view encountered an error" }), _jsx("p", { style: { color: "#a7b2ad", fontSize: "0.85rem", margin: "0 0 16px", maxWidth: "400px" }, children: this.state.errorMessage }), _jsx("p", { style: { color: "#61706a", fontSize: "0.78rem", margin: 0 }, children: "Switch to 2D mode or try resetting the scene." })] }));
        }
        return this.props.children;
    }
}
