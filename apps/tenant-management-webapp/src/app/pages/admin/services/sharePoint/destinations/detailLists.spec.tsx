import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SESSION_INIT } from '@store/session/models';
import {
  fetchSharepointForms,
  setUpSharepointDestination,
  SharepointVerifyReport,
  updateSharepointDestination,
  verifySharepointDestination,
} from '@store/sharePoint/actions';
import { DestinationModal } from './destinationModal';
import { DestinationsView } from './destinationsView';
import { TestDestinationModal } from './testDestinationModal';
import { describeColumnStatus, manualSteps, VerifySetupModal } from './verifySetupModal';

const connection = { id: 'hr-site', name: 'HR site', entraTenantId: 't', clientId: 'c', siteId: 's' };
const destination = {
  id: 'household',
  name: 'Household',
  connectionId: 'hr-site',
  listId: 'list-1',
  fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
  idempotencyFields: ['_adsp.key'],
};
const formDefinition = {
  id: 'housing',
  name: 'Housing benefit',
  sharepointConfigurationId: 'household',
  dataSchema: {
    type: 'object',
    properties: {
      applicant: { type: 'object', properties: { firstName: { type: 'string', title: 'First name' } } },
      proof: { type: 'string', format: 'file-urn' },
      householdMembers: {
        type: 'array',
        title: 'Household members',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
    },
  },
};

const storeWith = (sharepoint: Record<string, unknown> = {}) =>
  configureStore([])({
    sharepoint: {
      connections: { 'hr-site': connection },
      destinations: { household: destination },
      credentialStatus: {},
      testResults: {},
      verifyResults: {},
      forms: [formDefinition],
      ...sharepoint,
    },
    session: SESSION_INIT,
  });

const fire = (element: Element, detail: Record<string, unknown>) =>
  act(() => {
    element.dispatchEvent(new CustomEvent('_change', { detail: { name: element.getAttribute('name'), ...detail } }));
  });
const click = (root: HTMLElement, testId: string) =>
  act(() => {
    root.querySelector(`goa-button[testid="${testId}"]`).dispatchEvent(new CustomEvent('_click'));
  });

describe('DestinationModal with detail lists', () => {
  const renderModal = (store = storeWith(), destinationId: string | undefined = 'household', onSave = jest.fn()) => ({
    onSave,
    modal: render(
      <Provider store={store}>
        <DestinationModal destinationId={destinationId} onCancel={jest.fn()} onSave={onSave} />
      </Provider>,
    ).baseElement,
  });

  it('generates the mappings, a detail list ready to create and the folder link from a form', () => {
    const { modal, onSave } = renderModal();

    fire(modal.querySelector('[name="generate-form"]'), { value: 'housing' });
    click(modal, 'generate-mappings');
    click(modal, 'destination-modal-save');

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldMappings: [
          {
            source: 'applicant.firstName',
            target: 'ApplicantFirstName',
            displayName: 'First name',
            columnType: 'text',
          },
          { source: 'proof', target: 'Proof', displayName: 'Proof', columnType: 'hyperlink' },
        ],
        folderLinkField: 'AdspFilesFolder',
        detailLists: [
          {
            listName: 'Household members',
            dataPath: 'householdMembers',
            parentRefField: 'ParentItemId',
            fieldMappings: [{ source: 'name', target: 'Name', displayName: 'Name', columnType: 'text' }],
          },
        ],
        idempotencyFields: ['_adsp.key'],
      }),
    );
  });

  it('saves a trimmed document library name and ID, and leaves them out when empty', () => {
    const { modal, onSave } = renderModal();

    fire(modal.querySelector('[name="destination-library-name"]'), { value: ' Applicant documents ' });
    fire(modal.querySelector('[name="destination-library-id"]'), { value: ' library-1 ' });
    click(modal, 'destination-modal-save');
    fire(modal.querySelector('[name="destination-library-name"]'), { value: '  ' });
    fire(modal.querySelector('[name="destination-library-id"]'), { value: '  ' });
    click(modal, 'destination-modal-save');

    expect(onSave.mock.calls[0][0]).toMatchObject({
      documentFilesLibraryName: 'Applicant documents',
      documentFilesLibraryId: 'library-1',
    });
    expect(onSave.mock.calls[1][0]).not.toHaveProperty('documentFilesLibraryName');
    expect(onSave.mock.calls[1][0]).not.toHaveProperty('documentFilesLibraryId');
  });

  it('lists forms linked to the destination first', () => {
    const store = storeWith({
      forms: [{ ...formDefinition, id: 'aaa', name: 'Another form', sharepointConfigurationId: null }, formDefinition],
    });
    const labels = Array.from(
      renderModal(store).modal.querySelectorAll('goa-dropdown[name="generate-form"] goa-dropdown-item'),
    ).map((item) => item.getAttribute('label'));
    expect(labels).toEqual(['Housing benefit (linked)', 'Another form']);
  });

  it('has one dropdown to choose or search for a form', () => {
    const { modal } = renderModal();

    const dropdown = modal.querySelector('goa-dropdown[name="generate-form"]');
    expect(dropdown.getAttribute('filterable')).toBe('true');
    expect(dropdown.getAttribute('placeholder')).toBe('Choose or search for a form');
  });

  it('uses forms already loaded instead of loading them again', () => {
    const store = storeWith();
    renderModal(store);
    expect(store.getActions()).not.toContainEqual(fetchSharepointForms());
  });

  it('loads the forms when they are not loaded yet', () => {
    const store = storeWith({ forms: undefined });
    renderModal(store);
    expect(store.getActions()).toContainEqual(fetchSharepointForms());
  });

  it('shows that forms are loading until they arrive', () => {
    const dropdown = renderModal(storeWith({ forms: undefined })).modal.querySelector(
      'goa-dropdown[name="generate-form"]',
    );
    expect(dropdown.getAttribute('placeholder')).toBe('Loading forms…');
    expect(dropdown.getAttribute('disabled')).toBe('true');
  });

  it('adds a detail list, keeps "Update existing rows" on and saves only complete mappings', () => {
    const { modal, onSave } = renderModal();

    click(modal, 'detail-list-add');
    expect(modal.querySelector('goa-checkbox[name="destination-updates-rows"]').getAttribute('disabled')).toBe('true');
    fire(modal.querySelector('[name="detail-0-name"]'), { value: ' Pets ' });
    fire(modal.querySelector('[name="detail-0-data-path"]'), { value: 'pets' });
    fire(modal.querySelector('[name="detail-0-mapping-source-0"]'), { value: 'name' });
    fire(modal.querySelector('[name="detail-0-mapping-target-0"]'), { value: 'PetName' });
    fire(modal.querySelector('[name="detail-0-mapping-type-0"]'), { value: 'multilineText' });
    click(modal, 'detail-0-mapping-add');
    click(modal, 'destination-modal-save');

    expect(onSave.mock.calls[0][0].detailLists).toEqual([
      {
        listName: 'Pets',
        dataPath: 'pets',
        parentRefField: 'ParentItemId',
        fieldMappings: [{ source: 'name', target: 'PetName', columnType: 'multilineText' }],
      },
    ]);
  });

  it('shows a detail list problem and does not save', () => {
    const { modal, onSave } = renderModal();

    click(modal, 'detail-list-add');
    click(modal, 'destination-modal-save');

    expect(onSave).not.toHaveBeenCalled();
    expect(
      Array.from(modal.querySelectorAll('goa-form-item')).some(
        (item) => item.getAttribute('error') === 'Each detail list needs a list name or a SharePoint list ID.',
      ),
    ).toBe(true);
  });

  it('scrolls to the first field with an error', () => {
    const original = Element.prototype.scrollIntoView;
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };
    try {
      const { modal } = renderModal();

      click(modal, 'detail-list-add');
      click(modal, 'destination-modal-save');

      expect(scrolled).toHaveLength(1);
      expect(scrolled[0].getAttribute('error')).toBe('Each detail list needs a list name or a SharePoint list ID.');
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('keeps an existing detail list ID when generating again', () => {
    const store = storeWith({
      destinations: {
        household: {
          ...destination,
          detailLists: [
            { listId: 'members-list', dataPath: 'householdMembers', parentRefField: 'ParentItemId', fieldMappings: [] },
          ],
        },
      },
    });
    const { modal, onSave } = renderModal(store);

    fire(modal.querySelector('[name="generate-form"]'), { value: 'housing' });
    click(modal, 'generate-mappings');
    click(modal, 'destination-modal-save');

    expect(onSave.mock.calls[0][0].detailLists[0].listId).toBe('members-list');
  });
});

describe('VerifySetupModal', () => {
  const report: SharepointVerifyReport = {
    ready: false,
    lists: [
      {
        kind: 'main',
        listId: 'list-1',
        status: 'ok',
        columns: [
          {
            name: 'AdspItemKey',
            displayName: 'AdspItemKey',
            purpose: 'key',
            expectedType: 'text',
            status: 'notIndexed',
          },
          {
            name: 'FirstName',
            displayName: 'First name',
            purpose: 'mapped',
            expectedType: 'text',
            status: 'missing',
            matchingName: 'First_x0020_Name',
          },
          {
            name: 'Income',
            displayName: 'Income',
            purpose: 'mapped',
            expectedType: 'number',
            status: 'wrongType',
            actualType: 'text',
          },
        ],
      },
      {
        kind: 'detail',
        listName: 'Pets',
        dataPath: 'pets',
        status: 'notCreated',
        columns: [
          {
            name: 'ParentItemId',
            displayName: 'ParentItemId',
            purpose: 'parent',
            expectedType: 'text',
            status: 'missing',
          },
          { name: 'PetName', displayName: 'PetName', purpose: 'mapped', status: 'missing' },
        ],
      },
    ],
  };

  const renderVerify = (verifyResults: Record<string, unknown>) => {
    const store = storeWith({ verifyResults: { household: verifyResults } });
    const modal = render(
      <Provider store={store}>
        <VerifySetupModal destination={destination} onClose={jest.fn()} />
      </Provider>,
    ).baseElement;
    return { store, modal };
  };

  it('verifies the destination when it opens', () => {
    const store = storeWith();
    render(
      <Provider store={store}>
        <VerifySetupModal destination={destination} onClose={jest.fn()} />
      </Provider>,
    );
    expect(store.getActions()).toContainEqual(verifySharepointDestination('household'));
  });

  it('does not start another check while a save is already verifying', () => {
    const { store } = renderVerify({ loading: true });
    expect(store.getActions()).not.toContainEqual(verifySharepointDestination('household'));
  });

  it('shows each list and column with its status', () => {
    const { modal } = renderVerify({ loading: false, report });

    expect(modal.querySelector('[data-testid="verify-list-0"]')).toHaveTextContent('Main list');
    expect(modal.querySelector('[data-testid="verify-list-0"]')).toHaveTextContent('Not indexed');
    expect(modal.querySelector('[data-testid="verify-list-0"]')).toHaveTextContent("internal name 'First_x0020_Name'");
    expect(modal.querySelector('[data-testid="verify-list-0"]')).toHaveTextContent(
      'Wrong type: it is Text, the mapping needs Number',
    );
    expect(modal.querySelector('[data-testid="verify-list-1"]')).toHaveTextContent('Detail list: Pets');
    expect(modal.querySelector('[data-testid="verify-list-1"]')).toHaveTextContent('Not created yet.');
  });

  it('sets up the required lists and columns', () => {
    const { store, modal } = renderVerify({ loading: false, report });

    click(modal, 'verify-setup-run');

    expect(store.getActions()).toContainEqual(setUpSharepointDestination('household'));
  });

  it.each([
    ['ok', 'Ready'],
    ['notFound', 'Not found on the site. Check the document library ID.'],
    ['notADocumentLibrary', 'This is a list, not a document library. Use the ID of a document library.'],
  ])('shows the document library status %s', (status, text) => {
    const { modal } = renderVerify({
      loading: false,
      report: { ready: status === 'ok', lists: [], documentLibrary: { libraryId: 'library-1', status } },
    });

    const library = modal.querySelector('[data-testid="verify-document-library"]');
    expect(library).toHaveTextContent('Document library');
    expect(library).toHaveTextContent(text);
  });

  it.each([
    ['notFound', 'Not found on the site. Check the document library ID.'],
    ['notADocumentLibrary', 'This is a list, not a document library. Use the ID of a document library.'],
  ])('says at the top that the document library is %s', (status, text) => {
    const { modal } = renderVerify({
      loading: false,
      report: { ...report, ready: false, documentLibrary: { libraryId: 'library-1', status } },
    });

    expect(modal.querySelector('goa-callout[testid="verify-setup-library"]')).toHaveTextContent(text);
  });

  it('shows no document library warning when the library is ready', () => {
    const { modal } = renderVerify({
      loading: false,
      report: { ready: true, lists: [], documentLibrary: { libraryId: 'library-1', status: 'ok' } },
    });

    expect(modal.querySelector('goa-callout[testid="verify-setup-library"]')).toBeNull();
  });

  it('has nothing to set up when the destination is ready', () => {
    const { modal } = renderVerify({ loading: false, report: { ready: true, lists: [] } });

    expect(modal.querySelector('goa-button[testid="verify-setup-run"]').getAttribute('disabled')).toBe('true');
    expect(modal.querySelector('goa-callout[testid="verify-setup-ready"]')).toBeInTheDocument();
  });

  it('lists what the site owner must do when the app cannot change lists or columns', () => {
    const setup = { createdLists: [], createdColumns: [], indexedColumns: [], failures: [], permissionDenied: true };
    const { modal } = renderVerify({ loading: false, report, setup });

    const manual = modal.querySelector('goa-callout[testid="verify-setup-manual"]');
    expect(manual).toHaveTextContent('Index the AdspItemKey column of the main list.');
    expect(manual).toHaveTextContent("Create a list named 'Pets' with these columns");
  });

  it('says which list name is taken and how to fix it, without offering to reuse the list', () => {
    const { modal } = renderVerify({
      loading: false,
      report,
      listNameTaken: [{ index: 0, dataPath: 'pets', listName: 'Pets', listId: 'existing' }],
    });

    expect(modal.querySelector('goa-callout[testid="verify-setup-name-taken"]')).toHaveTextContent(
      "'Pets' already exists on the site. Change the detail list's name on the destination, or enter that list's ID",
    );
    expect(modal.querySelector('goa-callout[testid="verify-setup-name-taken"] goa-button')).toBeNull();
  });

  it('scrolls back to the top when a setup finishes', () => {
    const original = Element.prototype.scrollIntoView;
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const { modal } = renderVerify({ loading: false, report });

      click(modal, 'verify-setup-run');

      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('summarises a finished setup and its failures', () => {
    const setup = {
      createdLists: [{ index: 0, dataPath: 'pets', listName: 'Pets', listId: 'l2' }],
      createdColumns: [{ listId: 'l2', name: 'PetName' }],
      indexedColumns: [{ listId: 'list-1', name: 'AdspItemKey' }],
      failures: [{ listId: 'list-1', name: 'First Name', errorCode: 'invalid-column-name' }],
      permissionDenied: false,
    };
    const { modal } = renderVerify({ loading: false, report, setup });

    const done = modal.querySelector('goa-callout[testid="verify-setup-done"]');
    expect(done).toHaveTextContent('Created 1 lists and 1 columns, and indexed 1 columns.');
    expect(done).toHaveTextContent('First Name: SharePoint cannot use this column name.');
  });

  it('names column types SharePoint does not map to a column type', () => {
    const column = {
      name: 'Proof',
      displayName: 'Proof',
      purpose: 'mapped' as const,
      expectedType: 'hyperlink' as const,
    };
    expect(describeColumnStatus({ ...column, status: 'wrongType' as const, actualType: 'other' })).toBe(
      'Wrong type: it is a Lookup, Person or other special column, the mapping needs Hyperlink',
    );
    expect(
      describeColumnStatus({
        ...column,
        expectedType: 'number' as const,
        status: 'wrongType' as const,
        actualType: 'unknown',
      }),
    ).toBe('Wrong type: it is of a type SharePoint does not report, the mapping needs Number');
  });

  it('builds the manual steps from the report', () => {
    expect(manualSteps(report)).toEqual([
      'Add FirstName (Text) to the main list.',
      'Index the AdspItemKey column of the main list.',
      "Create a list named 'Pets' with these columns: ParentItemId (Text, indexed), PetName (Text). Then enter its ID on the destination.",
    ]);
  });

  describe('a named document library not created yet', () => {
    const libraryReport = {
      ready: false,
      lists: [],
      documentLibrary: { libraryName: 'Applicant documents', status: 'notCreated' as const },
    };

    it('shows the library by name, offers setup and adds no warning banner', () => {
      const { modal } = renderVerify({ loading: false, report: libraryReport });

      expect(modal.querySelector('[data-testid="verify-document-library"]')).toHaveTextContent('Applicant documents');
      expect(modal.querySelector('[data-testid="verify-document-library"]')).toHaveTextContent('Not created yet.');
      expect(modal.querySelector('goa-button[testid="verify-setup-run"]')).not.toHaveAttribute('disabled');
      expect(modal.querySelector('goa-callout[testid="verify-setup-library"]')).toBeNull();
    });

    it('asks the site owner to create the library when the app cannot', () => {
      expect(manualSteps(libraryReport)).toEqual([
        "Create a document library named 'Applicant documents'. Then enter its ID as the document library ID on the destination.",
      ]);
    });

    it('says setup created the library', () => {
      const setup = {
        createdLists: [],
        createdLibrary: { libraryName: 'Applicant documents', libraryId: 'new-library' },
        createdColumns: [],
        indexedColumns: [],
        failures: [],
        permissionDenied: false,
      };
      const { modal } = renderVerify({ loading: false, report: libraryReport, setup });

      expect(modal.querySelector('goa-callout[testid="verify-setup-done"]')).toHaveTextContent(
        "Created the document library 'Applicant documents'.",
      );
    });
  });
});

describe('DestinationsView verify setup', () => {
  it('starts loading forms for Generate as soon as the destinations tab opens', () => {
    const store = storeWith();
    render(
      <Provider store={store}>
        <DestinationsView />
      </Provider>,
    );
    expect(store.getActions()).toContainEqual(fetchSharepointForms());
  });

  it('opens Verify setup from a destination row', () => {
    const store = storeWith();
    const { baseElement } = render(
      <Provider store={store}>
        <DestinationsView />
      </Provider>,
    );

    act(() => {
      baseElement.querySelector('[testid="destination-verify-household"]').dispatchEvent(new CustomEvent('_click'));
    });

    expect(baseElement.querySelector('goa-modal[testid="verify-setup-modal"]')).toBeInTheDocument();
  });

  it('saves a destination and then verifies it', () => {
    const store = storeWith();
    const { baseElement } = render(
      <Provider store={store}>
        <DestinationsView />
      </Provider>,
    );

    act(() => {
      baseElement.querySelector('[testid="destination-edit-household"]').dispatchEvent(new CustomEvent('_click'));
    });
    click(baseElement, 'destination-modal-save');

    expect(store.getActions()).toContainEqual(updateSharepointDestination({ ...destination, enabled: true }, true));
    expect(baseElement.querySelector('goa-modal[testid="verify-setup-modal"]')).toBeInTheDocument();
  });
});

describe('TestDestinationModal with detail lists', () => {
  const withDetail = {
    ...destination,
    detailLists: [
      {
        listId: 'pets-list',
        listName: 'Pets',
        dataPath: 'pets',
        parentRefField: 'ParentItemId',
        fieldMappings: [{ source: 'name', target: 'PetName' }],
      },
    ],
  };

  const renderTest = (result: Record<string, unknown>) => {
    const { baseElement } = render(
      <Provider store={configureStore([])({ sharepoint: { testResults: { household: result } } })}>
        <TestDestinationModal destination={withDetail} onClose={jest.fn()} />
      </Provider>,
    );
    click(baseElement, 'test-destination-run');
    return baseElement;
  };

  it('starts the test data with one item for each detail list', () => {
    const { baseElement } = render(
      <Provider store={configureStore([])({ sharepoint: { testResults: {} } })}>
        <TestDestinationModal destination={withDetail} onClose={jest.fn()} />
      </Provider>,
    );
    expect(JSON.parse(baseElement.querySelector('goa-textarea').getAttribute('value'))).toEqual({
      applicant: { firstName: '' },
      pets: [{ name: '' }],
      _adsp: { key: 'test-1' },
    });
  });

  it('says how many detail rows were written', () => {
    const modal = renderTest({
      ok: true,
      outcome: 'created',
      detailRows: [{ listId: 'pets-list', rowIds: ['1', '2'] }],
    });
    expect(modal.querySelector('goa-callout[type="success"]')).toHaveTextContent('Pets: 2 rows written.');
  });

  it('says what happened to each detail list that was not fully updated', () => {
    const modal = renderTest({
      ok: false,
      errorCode: 'graph:invalidRequest',
      detailFailures: [
        { listId: 'pets-list', indexes: [1] },
        { listId: 'pets-list', indexes: [], oldRowsLeft: 2 },
      ],
    });
    const callout = modal.querySelector('goa-callout[type="emergency"]');
    expect(callout).toHaveTextContent('The main row was written, but some detail lists were not fully updated.');
    expect(callout).toHaveTextContent('Pets: item 2 was not written, so the rows from before are kept.');
    expect(callout).toHaveTextContent('Pets: the new rows were written, but 2 old rows could not be removed.');
  });
});
