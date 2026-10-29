import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditEventDetails } from './eventDetails';
import type { AuditEventRecord } from '@store/audit/models';

const baseEvent: AuditEventRecord = {
  id: 'event-1',
  namespace: 'form-app',
  occurredAt: '2026-01-01T00:00:00.000Z',
  action: 'submit',
  category: 'runtime',
  status: 'success',
  actor: { id: 'user-1', name: 'Ada', email: 'ada@example.com', roles: ['a', 'b'] },
};

describe('AuditEventDetails', () => {
  it('shows actor, resource and identifiers', () => {
    render(
      <AuditEventDetails
        event={{ ...baseEvent, correlationId: 'corr-1', resource: { type: 'form', id: 'f1' }, severity: 'high' }}
      />,
    );
    const details = screen.getByTestId('audit-event-details');
    expect(details).toHaveTextContent('Correlation ID: corr-1');
    expect(details).toHaveTextContent('Actor email: ada@example.com');
    expect(details).toHaveTextContent('Actor roles: a, b');
    expect(details).toHaveTextContent('Resource ID: f1');
    expect(details).toHaveTextContent('Severity: high');
  });

  it('shows the session ID and joins the scope IDs', () => {
    render(<AuditEventDetails event={{ ...baseEvent, sessionId: 'session-1', scopeIds: ['s-1', 's-2'] }} />);
    const details = screen.getByTestId('audit-event-details');
    expect(details).toHaveTextContent('Session ID: session-1');
    expect(details).toHaveTextContent('Scope: s-1, s-2');
  });

  it('shows the change set and metadata only when present', () => {
    const { rerender } = render(<AuditEventDetails event={baseEvent} />);
    expect(screen.queryByTestId('audit-event-changeset-after')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-event-metadata')).not.toBeInTheDocument();

    rerender(
      <AuditEventDetails
        event={{ ...baseEvent, changeSet: { before: { n: 1 }, after: { n: 2 } }, metadata: { reason: 'test' } }}
      />,
    );
    expect(screen.getByTestId('audit-event-changeset-before').textContent).toContain('"n": 1');
    expect(screen.getByTestId('audit-event-changeset-after').textContent).toContain('"n": 2');
    expect(screen.getByTestId('audit-event-metadata').textContent).toContain('"reason": "test"');
  });
});
