import { Component } from "react";
export class DeferredRender extends Component {
    constructor() {
        super(...arguments);
        this.state = { ready: false };
    }
    componentDidMount() {
        this.setState({ ready: true });
    }
    render() {
        if (!this.state.ready) {
            return this.props.placeholder ?? null;
        }
        return this.props.children;
    }
}
