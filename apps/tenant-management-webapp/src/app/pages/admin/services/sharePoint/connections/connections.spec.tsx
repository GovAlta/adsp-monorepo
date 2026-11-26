import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SESSION_INIT } from '@store/session/models';
import {
  deleteSharepointConnection,
  fetchSharepointConfiguration,
  fetchSharepointCredentialStatus,
} from '@store/sharePoint/actions';
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

  it('names the destinations that stop working, then deletes the connection', () => {
    const destination = (id: string, name: string, connectionId: string) => ({
      id,
      name,
      connectionId,
      listId: 'list-1',
      fieldMappings: [],
    });
    const store = configureStore([])({
      sharepoint: {
        connections: { a: connection('a'), b: connection('b') },
        destinations: { intake: destination('intake', 'HR intake', 'a'), log: destination('log', 'HR log', 'b') },
        credentialStatus: {},
        testResults: {},
      },
      session: SESSION_INIT,
    });
    const { baseElement } = render(
      <Provider store={store}>
        <ConnectionsView />
      </Provider>,
    );

    act(() => {
      baseElement
        .querySelector('goa-icon-button[testid="connection-delete-a"]')
        .dispatchEvent(new CustomEvent('_click'));
    });
    const confirmation = baseElement.querySelector('goa-modal[testid="delete-confirmation"]');
    expect(confirmation).toHaveTextContent('These destinations use this connection and will stop working: HR intake.');

    act(() => {
      confirmation.querySelector('goa-button[testid="delete-confirm"]').dispatchEvent(new CustomEvent('_click'));
    });
    expect(store.getActions()).toContainEqual(deleteSharepointConnection('a'));
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

  const hintsFor = (connectionId?: string) =>
    Array.from(
      render(
        <Provider store={storeWith()}>
          <ConnectionModal connectionId={connectionId} open={true} onCancel={jest.fn()} onSave={jest.fn()} />
        </Provider>,
      ).baseElement.querySelectorAll('goa-tooltip'),
    ).map((tooltip) => tooltip.getAttribute('content'));

  it('has a hint for every field', () => {
    const hints = hintsFor(undefined);
    expect(hints).toHaveLength(5);
    expect(hints.every((hint) => hint && hint.length > 20)).toBe(true);
  });

  it('tells the admin to keep the secret somewhere safe, since it cannot be read after saving', () => {
    const hints = hintsFor(undefined);
    expect(hints).toContainEqual(expect.stringContaining("can't be read again after saving"));
    expect(hints).toContainEqual(expect.stringContaining('secure location'));
  });

  it.each([
    ['adding', undefined, false],
    ['editing', 'a', true],
  ])('only says to leave the secret blank to keep it when %s a connection', (_, connectionId, expected) => {
    const hints = hintsFor(connectionId);
    expect(hints.some((hint) => hint?.includes('Leave this blank to keep the current secret'))).toBe(expected);
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

  describe('replacing the secret', () => {
    const siteId = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
    const renderEdit = (onSave: jest.Mock, credentialStatus: Record<string, unknown> = { a: { isSet: true } }) =>
      render(
        <Provider
          store={configureStore([])({
            sharepoint: {
              connections: { a: { ...connection('a'), siteId } },
              destinations: {},
              credentialStatus,
              testResults: {},
            },
            session: SESSION_INIT,
          })}
        >
          <ConnectionModal connectionId="a" open={true} onCancel={jest.fn()} onSave={onSave} />
        </Provider>,
      ).baseElement;
    const click = (element: Element) => element.dispatchEvent(new CustomEvent('_click'));
    const field = (baseElement: HTMLElement, name: string) => baseElement.querySelector(`goa-input[name="${name}"]`);
    const save = (baseElement: HTMLElement) =>
      act(() => click(baseElement.querySelector('goa-button[testid="connection-modal-save"]')));
    const enterSecretAndSave = (baseElement: HTMLElement) => {
      act(() => change(field(baseElement, 'client-secret'), 'new-secret'));
      save(baseElement);
    };
    const confirmationIn = (baseElement: HTMLElement) =>
      baseElement.querySelector('goa-modal[testid="replace-secret-confirmation"]');

    it('asks for confirmation, with a reminder to back up the current secret, before saving', () => {
      const onSave = jest.fn();
      const baseElement = renderEdit(onSave);

      enterSecretAndSave(baseElement);

      const confirmation = confirmationIn(baseElement);
      expect(confirmation).toHaveTextContent('Make sure you have the current secret saved as a backup');
      expect(onSave).not.toHaveBeenCalled();

      act(() => click(confirmation.querySelector('goa-button[testid="replace-secret-confirm"]')));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'new-secret');
    });

    it('goes back to editing, without saving, when the replacement is cancelled', () => {
      const onSave = jest.fn();
      const baseElement = renderEdit(onSave);

      enterSecretAndSave(baseElement);
      act(() => click(baseElement.querySelector('goa-button[testid="replace-secret-cancel"]')));

      expect(confirmationIn(baseElement)).toBeNull();
      expect(field(baseElement, 'client-secret').getAttribute('value')).toBe('new-secret');
      expect(onSave).not.toHaveBeenCalled();
    });

    it('saves without asking when the connection has no secret yet', () => {
      const onSave = jest.fn();
      const baseElement = renderEdit(onSave, { a: { isSet: false } });

      enterSecretAndSave(baseElement);

      expect(confirmationIn(baseElement)).toBeNull();
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'new-secret');
    });

    it('saves without asking when the secret is left blank', () => {
      const onSave = jest.fn();
      const baseElement = renderEdit(onSave);

      act(() => change(field(baseElement, 'connection-name'), 'HR site'));
      save(baseElement);

      expect(confirmationIn(baseElement)).toBeNull();
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'a', name: 'HR site' }), undefined);
    });

    it('saves a new connection with its secret without asking', () => {
      const onSave = jest.fn();
      const { baseElement } = render(
        <Provider store={storeWith()}>
          <ConnectionModal connectionId={undefined} open={true} onCancel={jest.fn()} onSave={onSave} />
        </Provider>,
      );

      act(() => {
        change(field(baseElement, 'connection-name'), 'HR site');
        change(field(baseElement, 'entra-tenant-id'), 'tenant-1');
        change(field(baseElement, 'client-id'), 'client-1');
        change(field(baseElement, 'site-id'), siteId);
      });
      enterSecretAndSave(baseElement);

      expect(confirmationIn(baseElement)).toBeNull();
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'HR site' }), 'new-secret');
    });
  });
});
