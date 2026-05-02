import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  placeholder?: ReactNode;
};

type State = {
  ready: boolean;
};

export class DeferredRender extends Component<Props, State> {
  state: State = { ready: false };

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
