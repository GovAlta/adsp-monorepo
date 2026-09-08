import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { FormDefinitionOverview } from './FormDefinitionOverview';
import { FormDefinition, ReviewConfiguration } from '../state/types';

const mockStore = configureStore();
const definitionId = 'intake';

const createState = (reviewConfiguration?: ReviewConfiguration) => ({
  user: {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@gov.ab.ca',
      roles: ['urn:ads:platform:form-service:form-admin'],
    },
  },
  form: {
    busy: {
      initializing: false,
      loading: false,
      findPdf: false,
      executing: false,
      exporting: false,
    },
    forms: {},
    submissions: {},
    definitions: {
      [definitionId]: {
        id: definitionId,
        urn: 'urn:ads:platform:configuration-service:v2:/configuration/form-service/intake',
        name: 'Intake',
        description: 'Program intake',
        revision: 2,
        supportTopic: false,
        anonymousApply: false,
        oneFormPerApplicant: true,
        generatesPdf: false,
        submissionRecords: true,
        scheduledIntakes: false,
        assessorRoles: [],
        dataSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string', title: 'First name' },
            lastName: { type: 'string', title: 'Last name' },
          },
        },
        reviewConfiguration,
      } as Partial<FormDefinition>,
    },
    results: {
      definitions: [],
      forms: [],
      submissions: [],
    },
    resultTotals: {
      definitions: 0,
      forms: 0,
      submissions: 0,
    },
    definitionCriteria: {},
    formCriteria: {},
    submissionCriteria: {},
    formSort: { field: 'created', direction: 'desc' },
    submissionSort: { field: 'created', direction: 'desc' },
    next: {
      definitions: null,
      forms: null,
      submissions: null,
    },
    selectedDefinition: definitionId,
    selectedForm: null,
    selectedSubmission: null,
    dispositionDraft: { status: '', reason: '' },
    export: {
      forms: {},
      submissions: {},
    },
  },
  calendar: {
    busy: {
      loading: false,
      executing: false,
    },
    events: {},
    results: [],
    next: null,
  },
});

const renderOverview = (reviewConfiguration?: ReviewConfiguration) => {
  const store = mockStore(createState(reviewConfiguration));
  return render(
    <Provider store={store}>
      <FormDefinitionOverview definitionId={definitionId} />
    </Provider>,
  );
};

describe('FormDefinitionOverview', () => {
  it('does not render the previous local column picker', () => {
    const { queryByText, baseElement } = renderOverview({ columns: [{ path: 'firstName' }] });

    expect(queryByText('Data value columns')).toBeNull();
    expect(queryByText('Show column')).toBeNull();
    expect(baseElement.querySelector('goa-checkbox')).toBeNull();
  });

  it('shows configured review columns in order', () => {
    const { getByTestId } = renderOverview({
      columns: [{ path: 'lastName' }, { path: 'firstName' }],
    });

    expect(getByTestId('review-column-name-lastName').textContent).toBe('Last name');
    expect(getByTestId('review-column-path-lastName').textContent).toBe('lastName');
    expect(getByTestId('review-column-name-firstName').textContent).toBe('First name');
  });

  it('shows an empty message when no review columns are configured', () => {
    const { getByTestId, queryByTestId } = renderOverview({ columns: [] });

    expect(getByTestId('review-columns-empty').textContent).toContain(
      'No review columns are configured. The list shows only system columns.',
    );
    expect(queryByTestId('review-columns-recap')).toBeNull();
  });
});
