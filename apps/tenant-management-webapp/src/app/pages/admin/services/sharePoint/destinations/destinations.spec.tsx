import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SESSION_INIT } from '@store/session/models';
import { describeTestFailure, sampleTestData, validateDestination } from './destinationHelpers';
import { DestinationsView } from './destinationsView';
import { DestinationModal } from './destinationModal';

const destination = {
  id: 'hr-intake',
  name: 'HR intake',
  connectionId: 'hr-site',
  listId: 'list-1',
  fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
};

describe('validateDestination', () => {
  it('accepts a complete destination', () => {
    expect(validateDestination(destination, [], true)).toEqual({});
  });

  it('requires name, connection, list and a complete mapping', () => {
    expect(
      validateDestination(
        { ...destination, name: '', connectionId: '', listId: '', fieldMappings: [{ source: 'a', target: '' }] },
        [],
        true,
      ),
    ).toEqual({
      name: 'Enter a name.',
      connectionId: 'Choose a connection.',
      listId: 'Enter the SharePoint list ID.',
      fieldMappings: 'Each mapping needs a form data path and a column name.',
    });
  });

  it('rejects a duplicate new destination and a mapping onto the key column', () => {
    expect(validateDestination(destination, ['hr-intake'], true).name).toBe(
      'A destination with this ID already exists.',
    );
    expect(
      validateDestination({ ...destination, fieldMappings: [{ source: 'a', target: 'AdspItemKey' }] }, [], true)
        .fieldMappings,
    ).toBe('AdspItemKey is set by ADSP and cannot be mapped.');
  });
});

describe('describeTestFailure', () => {
  it('explains common failures', () => {
    expect(describeTestFailure('credential-not-set')).toMatch(/no secret/);
    expect(describeTestFailure('graph:accessDenied')).toMatch(/grant/);
    expect(describeTestFailure('graph:invalidRequest', 'Nope')).toMatch(/'Nope'/);
    expect(describeTestFailure('something-else')).toBe(
      'The test failed. Check the connection and destination settings, then try again.',
    );
  });

  it('explains failures reaching the ADSP SharePoint service', () => {
    expect(describeTestFailure('adsp:unreachable')).toMatch(/SharePoint service could not be reached/);
    expect(describeTestFailure('adsp:http-403')).toMatch(/test-sharepoint-admin/);
  });

  it('explains a missing or unindexed key column and missing row identity data', () => {
    expect(describeTestFailure('graph:invalidRequest', 'AdspItemKey')).toBe(
      'Add an indexed single-line text column named AdspItemKey, or clear row identity on this destination.',
    );
    expect(describeTestFailure('row-identity-missing')).toMatch(/row identity/);
  });
});

describe('sampleTestData', () => {
  it('builds nested sample data from the mapping sources', () => {
    expect(
      sampleTestData([
        { source: 'applicant.firstName', target: 'FirstName' },
        { source: 'amount', target: 'Amount' },
      ]),
    ).toEqual({ applicant: { firstName: '' }, amount: '' });
  });

  it('fills each row identity field with a test value', () => {
    expect(sampleTestData([{ source: 'amount', target: 'Amount' }], ['_adsp.key'])).toEqual({
      amount: '',
      _adsp: { key: 'test-1' },
    });
  });
});

describe('DestinationsView', () => {
  it('lists destinations with their connection name and status', () => {
    const store = configureStore([])({
      sharepoint: {
        connections: { 'hr-site': { id: 'hr-site', name: 'HR site', entraTenantId: 't', clientId: 'c', siteId: 's' } },
        destinations: {
          'hr-intake': destination,
          'hr-off': { ...destination, id: 'hr-off', name: 'Off', enabled: false },
        },
        credentialStatus: {},
        testResults: {},
      },
      session: SESSION_INIT,
    });
    const { getByText, getAllByText } = render(
      <Provider store={store}>
        <DestinationsView />
      </Provider>,
    );
    expect(getByText('HR intake')).toBeInTheDocument();
    expect(getAllByText('HR site')).toHaveLength(2);
    expect(getByText('Enabled')).toBeInTheDocument();
    expect(getByText('Disabled')).toBeInTheDocument();
  });
});

describe('DestinationModal', () => {
  const isChecked = (modal: HTMLElement, name: string) =>
    modal.querySelector(`goa-checkbox[name="${name}"]`).getAttribute('checked') === 'true';

  const renderModal = (destinationId: string | undefined, onSave = jest.fn()) =>
    render(
      <Provider
        store={configureStore([])({
          sharepoint: {
            connections: {},
            destinations: {
              'hr-intake': { ...destination, idempotencyFields: ['application.number', 'year'], enabled: false },
              'hr-log': { ...destination, id: 'hr-log' },
            },
            credentialStatus: {},
            testResults: {},
          },
        })}
      >
        <DestinationModal destinationId={destinationId} onCancel={jest.fn()} onSave={onSave} />
      </Provider>,
    ).baseElement;

  const toggleUpdates = (modal: HTMLElement, checked: boolean) =>
    act(() => {
      modal
        .querySelector('goa-checkbox[name="destination-updates-rows"]')
        .dispatchEvent(
          new CustomEvent('_change', { detail: { name: 'destination-updates-rows', checked, value: checked } }),
        );
    });

  const save = (modal: HTMLElement) =>
    act(() => {
      modal.querySelector('goa-button[testid="destination-modal-save"]').dispatchEvent(new CustomEvent('_click'));
    });

  it('shows the update and enabled state of an existing destination', () => {
    const modal = renderModal('hr-intake');
    expect(isChecked(modal, 'destination-updates-rows')).toBe(true);
    expect(isChecked(modal, 'destination-enabled')).toBe(false);
  });

  it('starts a new destination with updating existing rows on', () => {
    const modal = renderModal(undefined);
    const checkbox = modal.querySelector('goa-checkbox[name="destination-updates-rows"]');
    expect(checkbox.getAttribute('text')).toBe('Update existing rows (requires an indexed AdspItemKey column)');
    expect(isChecked(modal, 'destination-updates-rows')).toBe(true);
  });

  it('keeps a custom row identity when the checkbox is left alone', () => {
    const onSave = jest.fn();
    save(renderModal('hr-intake', onSave));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ idempotencyFields: ['application.number', 'year'] }));
  });

  it('adds a new row each time once updating is turned off', () => {
    const onSave = jest.fn();
    const modal = renderModal('hr-intake', onSave);
    toggleUpdates(modal, false);
    save(modal);
    expect(onSave.mock.calls[0][0].idempotencyFields).toBeUndefined();
  });

  it('keys rows on _adsp.key once updating is turned on', () => {
    const onSave = jest.fn();
    const modal = renderModal('hr-log', onSave);
    toggleUpdates(modal, true);
    save(modal);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ idempotencyFields: ['_adsp.key'] }));
  });

  it('explains the destination ID, field mappings and enabled flag in info bubbles', () => {
    const hints = Array.from(renderModal(undefined).querySelectorAll('goa-tooltip')).map((tooltip) =>
      tooltip.getAttribute('content'),
    );
    expect(hints).toEqual([
      'Callers use this ID to push data to this destination.',
      'Map a form data path to a SharePoint column, for example applicant.name.first to FirstName.',
      'Disable pushing data to destination. Test actions can still push data.',
    ]);
  });

  it('enables a new destination by default', () => {
    expect(isChecked(renderModal(undefined), 'destination-enabled')).toBe(true);
  });
});
describe('DestinationModal editing', () => {
  const change = (element: Element, value: string) =>
    element.dispatchEvent(new CustomEvent('_change', { detail: { name: element.getAttribute('name'), value } }));

  it('keeps every field when several changes arrive before React re-renders', () => {
    const onSave = jest.fn();
    const { baseElement } = render(
      <Provider
        store={configureStore([])({
          sharepoint: {
            connections: {
              'hr-site': { id: 'hr-site', name: 'HR site', entraTenantId: 't', clientId: 'c', siteId: 's' },
            },
            destinations: {},
            credentialStatus: {},
            testResults: {},
          },
        })}
      >
        <DestinationModal destinationId={undefined} onCancel={jest.fn()} onSave={onSave} />
      </Provider>,
    );
    const field = (name: string) => baseElement.querySelector(`[name="${name}"]`);

    act(() => {
      change(field('destination-name'), 'HR intake');
      change(field('destination-connection'), 'hr-site');
      change(field('destination-list-id'), 'list-1');
      change(field('mapping-source-0'), 'applicant.firstName');
      change(field('mapping-target-0'), 'FirstName');
    });
    act(() => {
      baseElement.querySelector('goa-button[testid="destination-modal-save"]').dispatchEvent(new CustomEvent('_click'));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'HR intake',
        connectionId: 'hr-site',
        listId: 'list-1',
        fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
      }),
    );
  });
});
