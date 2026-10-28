import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AuditLogs } from './logs';

const state = (roles: string[], extra: Record<string, unknown> = {}) => ({
  session: { resourceAccess: { 'urn:ads:platform:audit-service': { roles } } },
  audit: {
    catalogs: [],
    namespaces: [],
    retention: { tenant: {}, applications: {} },
    loaded: false,
    events: { results: [], loading: false },
    ...extra,
  },
});

const renderLogs = (storeState: ReturnType<typeof state>) => {
  const store = configureStore([])(storeState);
  const utils = render(
    <Provider store={store}>
      <AuditLogs />
    </Provider>,
  );
  return { store, ...utils };
};

describe('AuditLogs', () => {
  it('asks for the audit-reader role when it is missing', () => {
    const { store, baseElement } = renderLogs(state([]));
    expect(baseElement.querySelector("goa-callout[testId='audit-role-callout']")).toBeInTheDocument();
    expect(store.getActions()).toEqual([]);
  });

  it('loads catalogs and the first page of events for readers', () => {
    const { store } = renderLogs(state(['audit-reader']));
    expect(store.getActions().map((a) => a.type)).toEqual([
      'audit/FETCH_AUDIT_CONFIGURATION_ACTION',
      'audit/FETCH_AUDIT_EVENTS_ACTION',
    ]);
  });

  it('only enables the resource ID once a resource type is entered', () => {
    const { baseElement } = renderLogs(state(['audit-reader']));
    const id = () => baseElement.querySelector("goa-input[name='audit-resource-id']");
    expect(id()).toHaveAttribute('disabled', 'true');

    const type = baseElement.querySelector("goa-input[name='audit-resource-type']");
    fireEvent(type, new CustomEvent('_change', { detail: { name: 'audit-resource-type', value: 'form' } }));
    expect(id()).not.toHaveAttribute('disabled', 'true');
  });

  it('lists namespaces from the namespaces endpoint that have no catalog', () => {
    const { baseElement } = renderLogs(state(['audit-reader'], { namespaces: ['mcp-gateway-service'] }));
    const option = baseElement.querySelector(
      "goa-dropdown[name='audit-namespace'] goa-dropdown-item[value='mcp-gateway-service']",
    );
    expect(option).toBeInTheDocument();
  });

  it('offers namespaces from the catalogs as a dropdown', () => {
    const catalogs = [{ application: 'form-app', isCore: false, actions: [{ name: 'submit' }] }];
    const { baseElement } = renderLogs(state(['audit-reader'], { catalogs }));
    expect(baseElement.querySelector("goa-dropdown[name='audit-namespace']")).toBeInTheDocument();
    expect(baseElement.querySelector("goa-dropdown[name='audit-action']")).toBeInTheDocument();
  });

  it('prefixes actions with their namespace and filters by both when one is chosen', () => {
    const catalogs = [
      { application: 'form-app', isCore: false, actions: [{ name: 'submit' }] },
      { application: 'file-app', isCore: false, actions: [{ name: 'submit' }] },
    ];
    const { store, baseElement } = renderLogs(state(['audit-reader'], { catalogs }));
    const items = Array.from(baseElement.querySelectorAll("goa-dropdown[name='audit-action'] goa-dropdown-item"));
    expect(items.map((i) => i.getAttribute('value'))).toEqual(['any', 'file-app/submit', 'form-app/submit']);

    const action = baseElement.querySelector("goa-dropdown[name='audit-action']");
    fireEvent(action, new CustomEvent('_change', { detail: { name: 'audit-action', value: 'form-app/submit' } }));
    fireEvent(baseElement.querySelector("goa-button[testId='audit-search']"), new CustomEvent('_click'));

    expect(store.getActions().pop()).toMatchObject({
      criteria: { namespace: 'form-app', action: 'submit' },
    });
  });

  it('exports with the criteria of the last search, and only when there are results', () => {
    const empty = renderLogs(state(['audit-reader']));
    expect(empty.baseElement.querySelector("goa-button[testId='audit-export']")).toHaveAttribute('disabled', 'true');
    empty.unmount();

    const results = [{ id: '1', namespace: 'form-app', action: 'submit', occurredAt: '2026-01-01T00:00:00Z' }];
    const { store, baseElement } = renderLogs(state(['audit-reader'], { events: { results, loading: false } }));
    const action = baseElement.querySelector("goa-input[name='audit-action']");
    fireEvent(action, new CustomEvent('_change', { detail: { name: 'audit-action', value: 'submit' } }));
    fireEvent(baseElement.querySelector("goa-button[testId='audit-search']"), new CustomEvent('_click'));
    fireEvent(baseElement.querySelector("goa-button[testId='audit-export']"), new CustomEvent('_click'));

    const exported = store.getActions().pop();
    expect(exported).toMatchObject({
      type: 'audit/EXPORT_AUDIT_EVENTS_ACTION',
      criteria: { action: 'submit' },
    });
    expect(exported).not.toHaveProperty('includePersonalInfo');
  });

  it('shows a removable chip for each applied filter', () => {
    const { store, baseElement } = renderLogs(state(['audit-reader']));
    const action = baseElement.querySelector("goa-input[name='audit-action']");
    fireEvent(action, new CustomEvent('_change', { detail: { name: 'audit-action', value: 'submit' } }));
    fireEvent(baseElement.querySelector("goa-button[testId='audit-search']"), new CustomEvent('_click'));

    const chip = baseElement.querySelector("goa-filter-chip[testId='audit-filter-badge-action']");
    expect(chip).toHaveAttribute('content', 'Action: submit');
    fireEvent(chip, new CustomEvent('_click'));

    const last = store.getActions().pop();
    expect(last.type).toBe('audit/FETCH_AUDIT_EVENTS_ACTION');
    expect(last.criteria.action).toBeUndefined();
    expect(baseElement.querySelector("goa-filter-chip[testId='audit-filter-badge-action']")).toBeNull();
  });

  describe('paging', () => {
    const results = [{ id: '1', namespace: 'form-app', action: 'submit', occurredAt: '2026-01-01T00:00:00Z' }];
    const paged = () => renderLogs(state(['audit-reader'], { events: { results, next: 'c2', loading: false } }));

    it('moves to the next page with the cursor, and back again', () => {
      const { store, baseElement } = paged();
      const button = (id: string) => baseElement.querySelector(`goa-button[testId='${id}']`);
      expect(button('audit-previous')).toHaveAttribute('disabled', 'true');

      fireEvent(button('audit-next'), new CustomEvent('_click'));
      expect(store.getActions().pop()).toMatchObject({ after: 'c2', top: 30 });
      expect(baseElement.querySelector("[data-testid='audit-result-count']")).toHaveTextContent('Showing 31–31 events');

      fireEvent(button('audit-previous'), new CustomEvent('_click'));
      const back = store.getActions().pop();
      expect(back.after).toBeUndefined();
      expect(back.top).toBe(30);
    });

    it('disables next on the last page', () => {
      const { baseElement } = renderLogs(state(['audit-reader'], { events: { results, loading: false } }));
      expect(baseElement.querySelector("goa-button[testId='audit-next']")).toHaveAttribute('disabled', 'true');
    });

    it('restarts from the first page when the page size changes', () => {
      const { store, baseElement } = paged();
      const size = baseElement.querySelector("goa-dropdown[name='audit-page-size']");
      fireEvent(size, new CustomEvent('_change', { detail: { name: 'audit-page-size', value: '10' } }));

      expect(store.getActions().pop()).toMatchObject({ top: 10 });
    });
  });

  it('searches with the entered filters', () => {
    const { store, baseElement } = renderLogs(state(['audit-reader']));
    const action = baseElement.querySelector("goa-input[name='audit-action']");
    fireEvent(action, new CustomEvent('_change', { detail: { name: 'audit-action', value: 'submit' } }));
    fireEvent(baseElement.querySelector("goa-button[testId='audit-search']"), new CustomEvent('_click'));

    const last = store.getActions().pop();
    expect(last).toMatchObject({ type: 'audit/FETCH_AUDIT_EVENTS_ACTION', criteria: { action: 'submit' } });
  });

  it('searches by severity, correlation ID and session ID', () => {
    const { store, baseElement } = renderLogs(state(['audit-reader']));
    const change = (name: string, value: string) =>
      fireEvent(baseElement.querySelector(`[name='${name}']`), new CustomEvent('_change', { detail: { name, value } }));
    change('audit-severity', 'critical');
    change('audit-correlation-id', 'trace-1');
    change('audit-session-id', 'session-1');
    fireEvent(baseElement.querySelector("goa-button[testId='audit-search']"), new CustomEvent('_click'));

    expect(store.getActions().pop()).toMatchObject({
      criteria: { severity: 'critical', correlationId: 'trace-1', sessionId: 'session-1' },
    });
  });
});
