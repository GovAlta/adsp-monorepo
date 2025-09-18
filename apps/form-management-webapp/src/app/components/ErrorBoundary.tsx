import React, { ReactNode } from 'react';

type ErrorBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
};
type ErrorBoundaryState = {
  hasError: boolean; // like this
};
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // eslint-disable-next-line
  componentDidCatch(error, info) {}

  render() {
    if (this.state?.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
