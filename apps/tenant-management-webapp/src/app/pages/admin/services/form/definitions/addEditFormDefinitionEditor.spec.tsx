import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AddEditFormDefinitionEditor, onSaveDispositionForModal } from './addEditFormDefinitionEditor';
import { Disposition, FormDefinition } from '@store/form/model';
import { Provider } from 'react-redux';
import { SESSION_INIT } from '@store/session/models';
import configureStore from 'redux-mock-store';
jest.mock('react-router-dom', () => ({
  useParams: () => ({
    id: '122',
  }),
  useNavigate: () => jest.fn(),
  useHistory: () => ({
    push: jest.fn(),
  }),
  useRouteMatch: () => ({ url: '/form/edit/A-really-really-long-formservice' }),
}));
describe('form Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    calendarService: {
      calendars: {
        coreCalendars: {
          'form-intake': {
            name: 'form-intake',
            displayName: 'Form intake',
            description: 'Calendar of scheduled form intakes.',
            readRoles: ['urn:ads:platform:tenant-service:platform-service'],
            updateRoles: ['urn:ads:platform:form-service:form-admin'],
            selectedCalendarEvents: [],
          },
        },
      },
    },
    fileService: {
      fileType: [
        {
          id: '12345edfg',
          name: '12345edfg',
          updateRoles: [],
          readRoles: [],
          anonymousRead: false,
          securityClassification: 'protected a',
        },
      ],
      newFileList: null,
      metrics: {
        filesUploaded: 9,
        fileLifetime: 0.47368055555555555,
      },
    },
    task: {
      queus: [
        {
          namespace: '2',
          name: '2',
          context: {},
          assignerRoles: [],
          workerRoles: [],
        },
      ],
    },
    notifications: { notifications: [] },
    pdf: {
      corePdfTemplates: {},
      jobs: [],
      files: {},
    },
    tenant: {
      realmRoles: [
        {
          name: 'testRoleA',
          id: 'test-role-a-id',
        },
        {
          name: 'testRoleB',
          id: 'test-role-b-id',
        },
      ],
    },
    session: SESSION_INIT,
    form: {
      editor: {},
    },
    serviceRoles: {},
  });
  test('Save button does not route', async () => {
    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <AddEditFormDefinitionEditor />
      </Provider>
    );
    const saveButton = baseElement.querySelector("goa-button[testId='definition-form-save']");
    fireEvent.click(saveButton);
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });
});

describe('Test AddEditFormDefinitionEditor', () => {
  const dispositionsToTest: Disposition[] = [
    {
      id: 'pending',
      name: 'pending',
      description: 'pending state',
    },
    {
      id: 'rejected',
      name: 'rejected',
      description: 'rejected state',
    },
  ];

  const definition: FormDefinition = {
    id: 'test-form',
    name: 'test-form',
    description: 'test form for unit testing',
    dataSchema: null,
    applicantRoles: [],
    clerkRoles: [],
    assessorRoles: [],
    formDraftUrlTemplate: 'http://test.com',
    anonymousApply: false,
    uiSchema: null,
    dispositionStates: dispositionsToTest,
    submissionRecords: true,
    supportTopic: false,
    queueTaskToProcess: { queueName: 'test-queue', queueNameSpace: 'queue-namespace' },
    submissionPdfTemplate: null,
  };

  it('can save new disposition state', () => {
    const addDispositionState: Disposition = {
      id: 'missing-data',
      name: 'missing data',
      description: 'missing data state',
    };

    const [updatedDefinition, index] = onSaveDispositionForModal(true, addDispositionState, definition, null);
    expect(updatedDefinition && updatedDefinition.dispositionStates.length > dispositionsToTest.length).toBe(true);
    expect(index).toBeNull();
  });

  it('cannot save new disposition state with undefined disposition states', () => {
    const initialLength = dispositionsToTest.length;
    const cloneDefinition = { ...definition };
    cloneDefinition.dispositionStates = [...dispositionsToTest];

    const [updatedDefinition, index] = onSaveDispositionForModal(true, undefined, cloneDefinition, null);
    const updatedLength = updatedDefinition.dispositionStates.length;

    expect(updatedDefinition && initialLength === updatedLength).toBe(true);
    expect(index).toBeNull();
  });

  it('can update disposition state', () => {
    const updateDispositionState: Disposition = {
      id: 'pending',
      name: 'new pending',
      description: 'new pending data state',
    };
    const currentIndex = definition.dispositionStates.findIndex((y) => y.id === updateDispositionState.id);
    const [updatedDefinition, index] = onSaveDispositionForModal(
      false,
      updateDispositionState,
      definition,
      currentIndex
    );
    const foundIndex = updatedDefinition.dispositionStates.findIndex((y) => y.name === 'new pending');
    expect(updatedDefinition && foundIndex >= 0).toBe(true);
    expect(index).toBeNull();
  });

  it('cannot find and update disposition state', () => {
    const updateDispositionState1: Disposition = {
      id: 'invalid pending',
      name: 'invalid new pending',
      description: 'invalid new pending data state',
    };

    const currentIndex = definition.dispositionStates.findIndex((y) => y.name === 'pending-test');
    const [updatedDefinition, index] = onSaveDispositionForModal(
      false,
      updateDispositionState1,
      definition,
      currentIndex
    );
    const updatedIndex = updatedDefinition.dispositionStates.findIndex((y) => y.name === updateDispositionState1.name);

    expect(updatedIndex).toBeGreaterThan(-1);
    expect(index).toBeNull();
  });
});
