import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SESSION_INIT } from '@store/session/models';
import { SharepointDetailList } from '@store/sharePoint/actions';
import { describeDetailFailures, describeTestFailure, sampleTestData, validateDestination } from './destinationHelpers';
import { DestinationsView } from './destinationsView';
import { DestinationModal } from './destinationModal';
import { TestDestinationModal } from './testDestinationModal';

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

  describe('detail lists', () => {
    const detailList = {
      listName: 'Household members',
      dataPath: 'householdMembers',
      parentRefField: 'ParentItemId',
      fieldMappings: [{ source: 'name', target: 'MemberName' }],
    };
    const withDetail = (overrides: Partial<SharepointDetailList> = {}, others: SharepointDetailList[] = []) => ({
      ...destination,
      idempotencyFields: ['_adsp.key'],
      detailLists: [{ ...detailList, ...overrides }, ...others],
    });

    it('accepts a detail list with a name or a list ID', () => {
      expect(validateDestination(withDetail(), [], true)).toEqual({});
      expect(validateDestination(withDetail({ listName: undefined, listId: 'list-2' }), [], true)).toEqual({});
    });

    it.each([
      [{ listName: undefined }, 'Each detail list needs a list name or a SharePoint list ID.'],
      [{ dataPath: '' }, 'Each detail list needs the path of its array in the data.'],
      [{ parentRefField: '' }, 'Each detail list needs a parent reference column.'],
      [{ fieldMappings: [] }, 'Each detail list needs at least one complete field mapping.'],
      [
        { fieldMappings: [{ source: 'name', target: '' }] },
        'Each detail list needs at least one complete field mapping.',
      ],
      [
        { fieldMappings: [{ source: 'x', target: 'ParentItemId' }] },
        'ParentItemId is set by ADSP and cannot be mapped.',
      ],
    ])('rejects an incomplete detail list', (overrides: Partial<SharepointDetailList>, message) => {
      expect(validateDestination(withDetail(overrides), [], true).detailLists).toBe(message);
    });

    it('rejects two detail lists for the same array', () => {
      expect(validateDestination(withDetail({}, [{ ...detailList, listName: 'Again' }]), [], true).detailLists).toBe(
        'Two detail lists use the same array path.',
      );
    });

    it('rejects two detail lists with the same list name', () => {
      expect(
        validateDestination(
          withDetail({}, [{ ...detailList, dataPath: 'pets', listName: ' household members' }]),
          [],
          true,
        ).detailLists,
      ).toBe('Two detail lists use the same list name.');
    });

    it('needs row identity for detail lists', () => {
      expect(validateDestination({ ...withDetail(), idempotencyFields: [] }, [], true).detailLists).toBe(
        'Detail lists need "Update existing rows" turned on.',
      );
    });
  });
});

describe('describeTestFailure', () => {
  it('explains a document library that cannot be used', () => {
    expect(describeTestFailure('document-library-not-found')).toBe(
      'The document library was not found on the site. Check the document library ID, or leave it empty to use Documents.',
    );
    expect(describeTestFailure('not-a-document-library')).toBe(
      'The document library ID belongs to a list, not a document library. Use the ID of a document library.',
    );
    expect(describeTestFailure('library-name-taken')).toMatch(/already exists on the site/);
    expect(describeTestFailure('library-not-created')).toMatch(/could not be created/);
  });

  it('explains common failures', () => {
    expect(describeTestFailure('credential-not-set')).toMatch(/no secret/);
    expect(describeTestFailure('credential-unreadable')).toMatch(/can't be read.*Enter the secret again/);
    expect(describeTestFailure('graph:accessDenied')).toMatch(/grant/);
    expect(describeTestFailure('graph:invalidRequest', 'Nope')).toMatch(/'Nope'/);
    expect(describeTestFailure('something-else')).toBe(
      'The test failed. Check the connection and destination settings, then try again.',
    );
  });

  it('explains failures reaching the ADSP SharePoint service', () => {
    expect(describeTestFailure('adsp:unreachable')).toMatch(/SharePoint service could not be reached/);
    expect(describeTestFailure('adsp:http-403')).toMatch(/You need the sharepoint-admin role/);
    expect(describeTestFailure('adsp:http-401')).toMatch(/sharepoint-admin role/);
  });

  it('explains a missing or unindexed key column and missing row identity data', () => {
    expect(describeTestFailure('graph:invalidRequest', 'AdspItemKey')).toBe(
      'Add an indexed single-line text column named AdspItemKey, or clear row identity on this destination.',
    );
    expect(describeTestFailure('row-identity-missing')).toMatch(/row identity/);
  });

  it('explains a detail list that is not set up yet and a refused setup', () => {
    expect(describeTestFailure('destination-not-set-up')).toMatch(/Verify setup/);
    expect(describeTestFailure('adsp:save-failed')).toMatch(/could not be saved/);
  });
});

describe('describeDetailFailures', () => {
  it('names the detail list and the items that were not written', () => {
    const lists = [
      {
        listId: 'l2',
        listName: 'Household members',
        dataPath: 'householdMembers',
        parentRefField: 'P',
        fieldMappings: [],
      },
    ];
    expect(describeDetailFailures([{ listId: 'l2', indexes: [0, 2] }], lists)).toEqual([
      'Household members: items 1 and 3 were not written, so the rows from before are kept.',
    ]);
    expect(describeDetailFailures([{ listId: 'l2', indexes: [], oldRowsLeft: 2 }], lists)).toEqual([
      'Household members: the new rows were written, but 2 old rows could not be removed. Run the test again.',
    ]);
    expect(describeDetailFailures([{ listId: 'l2', indexes: [1], newRowsLeft: 1 }], lists)).toEqual([
      'Household members: item 2 was not written, so the rows from before are kept. 1 row from this attempt could not be removed. Run the test again.',
    ]);
    expect(describeDetailFailures([{ listId: 'other', indexes: [1], column: 'Age' }], lists)).toEqual([
      "other: item 2 was not written (column 'Age'), so the rows from before are kept.",
    ]);
    expect(describeDetailFailures([{ listId: 'l2', indexes: [] }], lists)).toEqual([
      'Household members: the existing rows could not be read, so nothing was changed. Run the test again.',
    ]);
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

  it('uses a link value for Hyperlink columns, which reject text', () => {
    const link = { Url: 'https://example.com', Description: 'Sample link' };
    expect(
      sampleTestData([
        { source: 'proof', target: 'Proof', columnType: 'hyperlink' },
        { source: 'older', target: 'Older', linkFormat: 'hyperlink' },
        { source: 'note', target: 'Note', columnType: 'text', linkFormat: 'hyperlink' },
        { source: 'url', target: 'Url', linkFormat: 'text' },
      ]),
    ).toEqual({ proof: link, older: link, note: '', url: '' });
  });

  it('reads list positions written with brackets or with dots', () => {
    expect(
      sampleTestData([
        { source: 'dependents[0].name', target: 'First' },
        { source: 'dependents.1.name', target: 'Second' },
      ]),
    ).toEqual({ dependents: [{ name: '' }, { name: '' }] });
  });

  it('skips mapping sources that would change object prototypes', () => {
    const sample = sampleTestData([
      { source: '__proto__.polluted', target: 'A' },
      { source: 'constructor.prototype.polluted', target: 'B' },
      { source: 'name', target: 'Name' },
    ]);

    expect(sample).toEqual({ name: '' });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('uses a sample value of each column type and one item for each detail list', () => {
    expect(
      sampleTestData(
        [
          { source: 'income', target: 'Income', columnType: 'number' },
          { source: 'consent', target: 'Consent', columnType: 'boolean' },
          {
            source: 'contactMethods',
            target: 'ContactMethods',
            columnType: 'multiChoice',
            choices: ['Email', 'Phone'],
          },
          { source: 'dependents[0].name', target: 'FirstDependent' },
        ],
        [],
        [
          {
            dataPath: 'household.members',
            parentRefField: 'ParentItemId',
            fieldMappings: [
              { source: 'name', target: 'MemberName' },
              { source: 'birthDate', target: 'BirthDate', columnType: 'dateTime' },
            ],
          },
        ],
      ),
    ).toEqual({
      income: 0,
      consent: false,
      contactMethods: ['Email'],
      dependents: [{ name: '' }],
      household: { members: [{ name: '', birthDate: '2026-01-01' }] },
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

  it('explains the destination ID, generation, mappings, detail lists, document library, folder link and enabled flag in info bubbles', () => {
    const hints = Array.from(renderModal(undefined).querySelectorAll('goa-tooltip')).map((tooltip) =>
      tooltip.getAttribute('content'),
    );
    expect(hints).toEqual([
      'Callers use this ID to push data to this destination.',
      "Optional. Fills in the mappings, detail lists and column types below from a form's data schema.",
      'Map a form data path to a SharePoint column, for example applicant.name.first to FirstName.',
      'For repeating sections. Each section is a sub list with each section item as a row in the sub list.',
      'Verify setup creates a document library with this name when there is no document library ID.',
      "The document library for uploaded files. Files go to the site's Documents library when this and the name are empty.",
      'A Hyperlink column on the main list that links to the folder of files uploaded with each submission.',
      'Disable pushing data to destination. Test actions can still push data.',
    ]);
  });

  it('enables a new destination by default', () => {
    expect(isChecked(renderModal(undefined), 'destination-enabled')).toBe(true);
  });
});
describe('TestDestinationModal', () => {
  const helpText = (idempotencyFields?: string[]) =>
    render(
      <Provider store={configureStore([])({ sharepoint: { testResults: {} } })}>
        <TestDestinationModal destination={{ ...destination, idempotencyFields }} onClose={jest.fn()} />
      </Provider>,
    )
      .baseElement.querySelector('goa-form-item')
      .getAttribute('helptext');

  it('explains the row key when the destination updates existing rows', () => {
    expect(helpText(['_adsp.key'])).toContain('"_adsp"');
  });

  it('leaves the row key out when every push adds a row', () => {
    expect(helpText()).not.toMatch(/_adsp/);
  });

  it.each([
    ['created', 'The test data was added to the list as a new row.'],
    ['updated', 'The test data updated the existing row with this key.'],
  ])('says whether the test %s a row', (outcome, message) => {
    const { baseElement } = render(
      <Provider store={configureStore([])({ sharepoint: { testResults: { 'hr-intake': { ok: true, outcome } } } })}>
        <TestDestinationModal destination={destination} onClose={jest.fn()} />
      </Provider>,
    );
    act(() => {
      baseElement.querySelector('goa-button[testid="test-destination-run"]').dispatchEvent(new CustomEvent('_click'));
    });
    expect(baseElement.querySelector('goa-callout[type="success"]')).toHaveTextContent(message);
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
