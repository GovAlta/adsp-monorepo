import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
  // Fields render as <dt>label</dt><dd>value</dd> pairs.
  const valueOf = (section: string, label: string) =>
    within(screen.getByTestId(`audit-event-section-${section}`)).getByText(label).nextElementSibling;

  it('groups fields into event, actor, resource and identifier sections', () => {
    render(
      <AuditEventDetails
        event={{ ...baseEvent, correlationId: 'corr-1', resource: { type: 'form', id: 'f1' }, severity: 'high' }}
      />,
    );
    expect(valueOf('identifiers', 'Correlation ID')).toHaveTextContent('corr-1');
    expect(valueOf('actor', 'Email')).toHaveTextContent('ada@example.com');
    expect(valueOf('resource', 'ID')).toHaveTextContent('f1');
    expect(valueOf('event', 'Severity')).toHaveTextContent('high');
    expect(valueOf('event', 'Outcome')).toHaveTextContent('success');
  });

  it('puts the actor roles in a collapsed section with a count, sorted', () => {
    const { baseElement } = render(
      <AuditEventDetails event={{ ...baseEvent, actor: { ...baseEvent.actor, roles: ['b-role', 'a-role'] } }} />,
    );
    expect(baseElement.querySelector("goa-details[testId='audit-event-actor-roles']")).toHaveAttribute(
      'heading',
      'Roles (2)',
    );
    const items = within(screen.getByTestId('audit-event-actor-role-list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['a-role', 'b-role']);
  });

  it('omits the roles section and resource when absent', () => {
    const { baseElement } = render(<AuditEventDetails event={{ ...baseEvent, actor: { id: 'u1' } }} />);
    expect(baseElement.querySelector("goa-details[testId='audit-event-actor-roles']")).toBeNull();
    expect(screen.queryByTestId('audit-event-section-resource')).not.toBeInTheDocument();
  });

  it('shows the session ID and joins the scope IDs', () => {
    render(<AuditEventDetails event={{ ...baseEvent, sessionId: 'session-1', scopeIds: ['s-1', 's-2'] }} />);
    expect(valueOf('identifiers', 'Session ID')).toHaveTextContent('session-1');
    expect(valueOf('identifiers', 'Scope')).toHaveTextContent('s-1, s-2');
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
    expect(screen.getByTestId('audit-changeset-diff')).toHaveTextContent('n');
    expect(screen.getByTestId('audit-changeset-summary')).toHaveTextContent('1 changed');
    expect(screen.getByTestId('audit-event-metadata').textContent).toContain('"reason": "test"');
  });

  it('switches the change set between diff and raw JSON', () => {
    const { baseElement } = render(
      <AuditEventDetails event={{ ...baseEvent, changeSet: { before: { n: 1 }, after: { n: 2 } } }} />,
    );
    fireEvent(baseElement.querySelector("goa-button[testId='audit-changeset-mode-json']"), new CustomEvent('_click'));
    expect(screen.getByTestId('audit-event-changeset-before').textContent).toContain('"n": 1');
    expect(screen.getByTestId('audit-event-changeset-after').textContent).toContain('"n": 2');
    expect(screen.queryByTestId('audit-changeset-diff')).not.toBeInTheDocument();
  });
});
