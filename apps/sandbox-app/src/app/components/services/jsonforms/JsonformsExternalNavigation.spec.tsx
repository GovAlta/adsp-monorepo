import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonformsExternalNavigation, fieldLabel } from './JsonformsExternalNavigation';

const mockState = {
  directory: {} as Record<string, string>,
  definitions: {} as Record<string, unknown>,
  formsInitialized: false,
  forms: [] as { id: string }[],
};

const mockDispatch = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (s: unknown) => unknown) =>
    selector({
      config: { directory: mockState.directory },
      form: { definitions: mockState.definitions, initialized: { forms: mockState.formsInitialized } },
    }),
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ tenant: 'autotest' }),
}));

jest.mock('../../../state', () => ({
  createDefinitionFromTemplate: jest.fn((arg) => ({ type: 'createDefinition', payload: arg })),
  createForm: jest.fn((arg) => ({ type: 'createForm', payload: arg })),
  findUserForms: jest.fn((arg) => ({ type: 'findUserForms', payload: arg })),
  loadDefinition: jest.fn((arg) => ({ type: 'loadDefinition', payload: arg })),
  loadFormData: jest.fn((arg) => ({ type: 'loadFormData', payload: arg })),
  directorySelector: (s: { config: { directory: Record<string, string> } }) => s.config.directory,
  definitionFormsSelector: () => ({ forms: mockState.forms, next: null }),
}));

// Captures the callback the page hands to ReviewRenderProvider, so a Change button can be
// simulated without rendering the review renderers.
const reviewChange: { current?: (stepId: number | undefined, scope: string) => void } = {};

jest.mock('@abgov/jsonforms-components', () => ({
  ...jest.requireActual('@abgov/jsonforms-components'),
  ContextProviderFactory: () => ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReviewRenderProvider: ({
    children,
    onReviewChange,
  }: {
    children: React.ReactNode;
    onReviewChange: (stepId: number | undefined, scope: string) => void;
  }) => {
    reviewChange.current = onReviewChange;
    return <div data-testid="review-provider">{children}</div>;
  },
  createDefaultAjv: () => ({}),
  GoAReviewRenderers: [],
  GoACells: [],
}));

jest.mock('@jsonforms/react', () => ({
  // The real module still has to load: jsonforms-components binds its controls with
  // withJsonFormsControlProps at import time.
  ...jest.requireActual('@jsonforms/react'),
  JsonForms: () => <div data-testid="review-form" />,
}));

jest.mock('../../LoadingIndicator', () => ({
  LoadingIndicator: () => <div data-testid="loading" />,
}));

jest.mock('../../styled-components', () => ({
  ServiceContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabCallout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabButton: ({
    children,
    testId,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    testId: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid={testId} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

const definitionWith = (uiSchema: unknown) => ({
  'sandbox-external-navigation': { id: 'sandbox-external-navigation', uiSchema },
});

const twoPageUiSchema = {
  type: 'Categorization',
  options: { variant: 'pages' },
  elements: [
    {
      type: 'Category',
      label: 'Personal Information',
      options: { id: 'personal-information' },
      elements: [{ type: 'Control', scope: '#/properties/fullName' }],
    },
    {
      type: 'Category',
      label: 'Upload Information',
      elements: [{ type: 'Control', scope: '#/properties/supportingDocuments' }],
    },
  ],
};

describe('fieldLabel', () => {
  it('derives a readable label from a scope pointer', () => {
    expect(fieldLabel('#/properties/fullName')).toBe('Full Name');
    expect(fieldLabel('#/properties/mailingAddress')).toBe('Mailing Address');
  });

  it('falls back to the scope when there is no trailing property', () => {
    expect(fieldLabel('')).toBe('');
  });
});

describe('JsonformsExternalNavigation', () => {
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

  beforeEach(() => {
    mockDispatch.mockClear();
    openSpy.mockClear();
    mockState.directory = { 'urn:ads:platform:form-app': 'https://form.test' };
    mockState.definitions = {};
    mockState.formsInitialized = false;
    mockState.forms = [];
  });

  it('looks the demo definition up when it has not been loaded', () => {
    render(<JsonformsExternalNavigation />);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'loadDefinition', payload: 'sandbox-external-navigation' }),
    );
  });

  it('offers to create the definition once form-service reports it missing', () => {
    mockState.definitions = { 'sandbox-external-navigation': null };

    render(<JsonformsExternalNavigation />);

    expect(screen.getByTestId('create-demo-definition')).toBeInTheDocument();
    expect(screen.queryByTestId('create-demo-draft')).not.toBeInTheDocument();
  });

  it('offers to create a draft once the definition exists but the user has none', () => {
    mockState.definitions = definitionWith({});
    mockState.formsInitialized = true;

    render(<JsonformsExternalNavigation />);

    expect(screen.getByTestId('create-demo-draft')).toBeInTheDocument();
    expect(screen.queryByTestId('create-demo-definition')).not.toBeInTheDocument();
  });

  it('renders a link per page and per field once a draft exists', () => {
    mockState.definitions = definitionWith(twoPageUiSchema);
    mockState.formsInitialized = true;
    mockState.forms = [{ id: 'form-1' }];

    render(<JsonformsExternalNavigation />);

    expect(screen.getByTestId('form-page-link-personal-information')).toHaveTextContent('(named)');
    expect(screen.getByTestId('form-page-link-page-2')).toHaveTextContent('(positional)');
    expect(screen.getByTestId('form-field-link-#/properties/fullName')).toBeInTheDocument();
  });

  it('links a field by its authored id when it has one', () => {
    mockState.definitions = definitionWith({
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Personal Information',
          options: { id: 'personal-information' },
          elements: [
            {
              type: 'VerticalLayout',
              elements: [
                { type: 'Control', scope: '#/properties/fullName', options: { id: 'applicant-full-name' } },
                { type: 'Control', scope: '#/properties/age' },
              ],
            },
          ],
        },
      ],
    });
    mockState.formsInitialized = true;
    mockState.forms = [{ id: 'form-1' }];

    render(<JsonformsExternalNavigation />);

    expect(screen.getByTestId('form-field-link-applicant-full-name')).toHaveTextContent('(named)');
    expect(screen.getByTestId('form-field-link-#/properties/age')).toBeInTheDocument();
  });

  it('loads the draft data so there is something to summarise', () => {
    mockState.definitions = definitionWith(twoPageUiSchema);
    mockState.formsInitialized = true;
    mockState.forms = [{ id: 'form-1' }];

    render(<JsonformsExternalNavigation />);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'loadFormData', payload: 'form-1' }));
  });

  it('renders the review summary once a draft exists', () => {
    mockState.definitions = definitionWith(twoPageUiSchema);
    mockState.formsInitialized = true;
    mockState.forms = [{ id: 'form-1' }];

    render(<JsonformsExternalNavigation />);

    expect(screen.getByTestId('review-provider')).toBeInTheDocument();
    expect(screen.getByTestId('review-form')).toBeInTheDocument();
  });

  it('turns a Change button into a deep link, by authored id where the control has one', () => {
    mockState.definitions = definitionWith({
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Personal Information',
          options: { id: 'personal-information' },
          elements: [
            {
              type: 'VerticalLayout',
              elements: [
                { type: 'Control', scope: '#/properties/fullName', options: { id: 'applicant-full-name' } },
                { type: 'Control', scope: '#/properties/age' },
              ],
            },
          ],
        },
      ],
    });
    mockState.formsInitialized = true;
    mockState.forms = [{ id: 'form-1' }];

    render(<JsonformsExternalNavigation />);

    reviewChange.current(0, '#/properties/fullName');
    expect(openSpy).toHaveBeenCalledWith(
      'https://form.test/autotest/sandbox-external-navigation/form-1?page=personal-information&fieldId=applicant-full-name',
      '_blank',
      'noopener,noreferrer',
    );

    reviewChange.current(0, '#/properties/age');
    expect(openSpy).toHaveBeenLastCalledWith(
      'https://form.test/autotest/sandbox-external-navigation/form-1?page=personal-information&field=%23%2Fproperties%2Fage',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('disables the links when the directory has no form app address', () => {
    mockState.directory = {};
    mockState.definitions = definitionWith(twoPageUiSchema);
    mockState.formsInitialized = true;
    mockState.forms = [{ id: 'form-1' }];

    render(<JsonformsExternalNavigation />);

    expect(screen.getByTestId('form-page-link-personal-information')).toBeDisabled();
  });
});
