import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SESSION_INIT } from '@store/session/models';
import {
  describeTestFailure,
  formatIdempotencyFields,
  parseIdempotencyFields,
  sampleTestData,
  validateDestination,
} from './destinationHelpers';
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

  it('rejects a row identity field listed twice', () => {
    expect(validateDestination({ ...destination, idempotencyFields: ['a', 'a'] }, [], true).idempotencyFields).toBe(
      'List each row identity field once.',
    );
  });
});

describe('idempotency fields text', () => {
  it('parses comma-separated paths, ignoring blanks', () => {
    expect(parseIdempotencyFields(' application.number, year ,, ')).toEqual(['application.number', 'year']);
    expect(parseIdempotencyFields('  ')).toEqual([]);
  });

  it('formats paths back to text', () => {
    expect(formatIdempotencyFields(['application.number', 'year'])).toBe('application.number, year');
    expect(formatIdempotencyFields(undefined)).toBe('');
  });
});

describe('describeTestFailure', () => {
  it('explains common failures', () => {
    expect(describeTestFailure('credential-not-set')).toMatch(/no secret/);
    expect(describeTestFailure('graph:accessDenied')).toMatch(/grant/);
    expect(describeTestFailure('graph:invalidRequest', 'Nope')).toMatch(/'Nope'/);
    expect(describeTestFailure('something-else')).toBe('The test failed with something-else.');
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
  const isEnabledChecked = (modal: HTMLElement) =>
    modal.querySelector('goa-checkbox[name="destination-enabled"]').getAttribute('checked') === 'true';

  const renderModal = (destinationId: string | undefined) =>
    render(
      <Provider
        store={configureStore([])({
          sharepoint: {
            connections: {},
            destinations: {
              'hr-intake': { ...destination, idempotencyFields: ['application.number', 'year'], enabled: false },
            },
            credentialStatus: {},
            testResults: {},
          },
        })}
      >
        <DestinationModal destinationId={destinationId} onCancel={jest.fn()} onSave={jest.fn()} />
      </Provider>,
    ).baseElement;

  it('shows the row identity fields and enabled state of an existing destination', () => {
    const modal = renderModal('hr-intake');
    expect(modal.querySelector('goa-input[name="destination-idempotency-fields"]').getAttribute('value')).toBe(
      'application.number, year',
    );
    expect(isEnabledChecked(modal)).toBe(false);
  });

  it('starts a new destination with the Form Service key as its row identity', () => {
    const modal = renderModal(undefined);
    expect(modal.querySelector('goa-input[name="destination-idempotency-fields"]').getAttribute('value')).toBe(
      '_adsp.key',
    );
  });

  it('enables a new destination by default', () => {
    const modal = renderModal(undefined);
    expect(isEnabledChecked(modal)).toBe(true);
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
