import { Button } from './button';
import { Component } from 'react';
import type { ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="panel" role="alert"><h1>We could not display this page.</h1>
      <p>Reload the page to reconnect. If a change was being saved, review its result before submitting again.</p>
      <Button onClick={() => window.location.reload()}>Reload page</Button></main>;
    return this.props.children;
  }
}
