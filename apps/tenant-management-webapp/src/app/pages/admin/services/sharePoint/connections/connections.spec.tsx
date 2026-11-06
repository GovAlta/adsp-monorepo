import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SESSION_INIT } from '@store/session/models';
import { fetchSharepointConfiguration, fetchSharepointCredentialStatus } from '@store/sharePoint/actions';
import { ConnectionsView } from './connectionsView';
import { ConnectionModal } from './connectionModal';

const connection = (id: string) => ({ id, name: id, entraTenantId: 't', clientId: 'c', siteId: `site-${id}` });

const storeWith = (credentialStatus = {}) =>
  configureStore([])({
    sharepoint: {
      connections: { a: connection('a'), b: connection('b') },
      destinations: {},
      credentialStatus,
      testResults: {},
    },
    session: SESSION_INIT,
  });

describe('ConnectionsView', () => {
  it('loads the configuration', () => {
    const store = storeWith();
    render(
      <Provider store={store}>
        <ConnectionsView />
      </Provider>,
    );
    expect(store.getActions()).toEqual([fetchSharepointConfiguration()]);
  });
});

describe('ConnectionModal', () => {
  it('loads the secret status when editing a connection', () => {
    const store = storeWith();
    render(
      <Provider store={store}>
        <ConnectionModal connectionId="a" open={true} onCancel={jest.fn()} onSave={jest.fn()} />
      </Provider>,
    );
    expect(store.getActions()).toEqual([fetchSharepointCredentialStatus('a')]);
  });

  it('has a hint for every field', () => {
    const { baseElement } = render(
      <Provider store={storeWith()}>
        <ConnectionModal connectionId={undefined} open={true} onCancel={jest.fn()} onSave={jest.fn()} />
      </Provider>,
    );
    const hints = Array.from(baseElement.querySelectorAll('goa-tooltip')).map((tooltip) =>
      tooltip.getAttribute('content'),
    );
    expect(hints).toHaveLength(5);
    expect(hints.every((hint) => hint && hint.length > 20)).toBe(true);
  });

  it('takes the site ID as one value and shows its parts', () => {
    const siteId = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
    const { baseElement, getByText } = render(
      <Provider
        store={configureStore([])({
          sharepoint: {
            connections: { a: { ...connection('a'), siteId } },
            destinations: {},
            credentialStatus: {},
            testResults: {},
          },
          session: SESSION_INIT,
        })}
      >
        <ConnectionModal connectionId="a" open={true} onCancel={jest.fn()} onSave={jest.fn()} />
      </Provider>,
    );
    expect(baseElement.querySelector('goa-input[name="site-id"]').getAttribute('value')).toBe(siteId);
    expect(getByText('5a58bb09-1fba-41c1-8125-69da264370a0')).toBeInTheDocument();
    expect(getByText('9f2ec1da-0be4-4a74-9254-973f0add78fd')).toBeInTheDocument();
  });

  it('never pre-fills the secret and masks it', () => {
    const { baseElement } = render(
      <Provider store={storeWith({ a: { isSet: true } })}>
        <ConnectionModal connectionId="a" open={true} onCancel={jest.fn()} onSave={jest.fn()} />
      </Provider>,
    );
    const secret = baseElement.querySelector('goa-input[name="client-secret"]');
    expect(secret.getAttribute('type')).toBe('password');
    expect(secret.getAttribute('value') || '').toBe('');
  });

  it('does not prefill the Entra tenant ID with the ADSP realm', () => {
    const { baseElement } = render(
      <Provider
        store={configureStore([])({
          sharepoint: { connections: {}, destinations: {}, credentialStatus: {}, testResults: {} },
          session: { ...SESSION_INIT, realm: 'adsp-realm' },
        })}
      >
        <ConnectionModal connectionId={undefined} open={true} onCancel={jest.fn()} onSave={jest.fn()} />
      </Provider>,
    );
    expect(baseElement.querySelector('goa-input[name="entra-tenant-id"]').getAttribute('value') || '').toBe('');
  });
});

describe('ConnectionModal editing', () => {
  const change = (element: Element, value: string) =>
    element.dispatchEvent(new CustomEvent('_change', { detail: { name: element.getAttribute('name'), value } }));

  it('keeps every field when several changes arrive before React re-renders', () => {
    const onSave = jest.fn();
    const siteId = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
    const { baseElement } = render(
      <Provider store={storeWith()}>
        <ConnectionModal connectionId={undefined} open={true} onCancel={jest.fn()} onSave={onSave} />
      </Provider>,
    );
    const field = (name: string) => baseElement.querySelector(`goa-input[name="${name}"]`);

    act(() => {
      change(field('connection-name'), 'HR site');
      change(field('entra-tenant-id'), 'tenant-1');
      change(field('client-id'), 'client-1');
      change(field('site-id'), siteId);
    });
    act(() => {
      baseElement.querySelector('goa-button[testid="connection-modal-save"]').dispatchEvent(new CustomEvent('_click'));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'HR site', entraTenantId: 'tenant-1', clientId: 'client-1', siteId }),
      undefined,
    );
  });
});
