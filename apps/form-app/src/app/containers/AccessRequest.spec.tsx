import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any;
const mockDispatch = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let jsonFormsProps: any;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: (state: any) => unknown) => selector(mockState),
  useDispatch: () => mockDispatch,
}));

jest.mock('../state', () => ({
  ...jest.requireActual('../state'),
  loadAccessRequest: jest.fn((definitionId: string) => ({ type: 'load-access-request', payload: definitionId })),
  submitAccessRequest: jest.fn((arg) => ({ type: 'submit-access-request', payload: arg })),
}));

// The questions are rendered by JsonForms; the tests drive it through its props.
jest.mock('@jsonforms/react', () => ({
  ...jest.requireActual('@jsonforms/react'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  JsonForms: (props: any) => {
    jsonFormsProps = props;
    return <div data-testid="questions" />;
  },
}));

const { AccessRequest, RestrictedForm } = require('./AccessRequest');
const { submitAccessRequest } = require('../state');

const DEFINITION_ID = 'medical-intake';
const FORM = {
  definitionId: DEFINITION_ID,
  name: 'Medical intake',
  dataSchema: { type: 'object', properties: { profession: { type: 'string' } }, required: ['profession'] },
  uiSchema: {
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/profession', label: 'Profession' }],
  },
};
const requiredError = {
  instancePath: '',
  keyword: 'required',
  params: { missingProperty: 'profession' },
  message: "must have required property 'profession'",
};
const invalidCallout = () => document.querySelector("goa-callout[testid='access-request-invalid']");

const setState = ({
  loaded = true,
  form = FORM,
  request = undefined,
  submitting = false,
  submitError = null,
}: {
  loaded?: boolean;
  form?: unknown;
  request?: unknown;
  submitting?: boolean;
  submitError?: string;
} = {}) => {
  mockState = {
    user: {
      tenant: { id: 'tenant', name: 'autotest', realm: 'realm' },
      user: { id: 'user-1', name: 'Test User', email: 'test.user@gov.ab.ca', roles: [] },
    },
    accessRequest: {
      forms: loaded ? { [DEFINITION_ID]: form } : {},
      requests: request === undefined ? {} : { [DEFINITION_ID]: request },
      busy: { loading: false, submitting },
      submitError,
    },
  };
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccessRequest definitionId={DEFINITION_ID} />
    </MemoryRouter>,
  );

const button = (testId: string) => document.querySelector(`goa-button[testid='${testId}']`) as HTMLElement;
const click = async (testId: string) => {
  await act(async () => {
    fireEvent(button(testId), new CustomEvent('_click'));
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jsonFormsProps = undefined;
  mockDispatch.mockResolvedValue({ payload: {} });
  setState();
});

describe('AccessRequest', () => {
  it('loads the questions when they are not loaded yet', () => {
    setState({ loaded: false });

    renderPage();

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'load-access-request', payload: DEFINITION_ID });
    expect(screen.queryByTestId('questions')).not.toBeInTheDocument();
  });

  it('shows the questions and who is requesting access', () => {
    renderPage();

    expect(invalidCallout()).not.toBeInTheDocument();
    expect(screen.getByTestId('access-request-applicant')).toHaveTextContent(
      'Requesting access as Test User (test.user@gov.ab.ca).',
    );
    expect(jsonFormsProps.schema).toEqual(FORM.dataSchema);
    expect(jsonFormsProps.validationMode).toBe('ValidateAndHide');
  });

  it('shows the required errors and does not submit when answers are missing', async () => {
    renderPage();
    act(() => jsonFormsProps.onChange({ data: {}, errors: [requiredError] }));

    await click('access-request-submit');

    expect(jsonFormsProps.validationMode).toBe('ValidateAndShow');
    expect(invalidCallout()).toHaveTextContent('Answer these questions before you submit: Profession.');
    expect(submitAccessRequest).not.toHaveBeenCalled();
  });

  describe('with a required checkbox', () => {
    const checkboxForm = {
      ...FORM,
      dataSchema: {
        type: 'object',
        properties: { confirmed: { type: 'boolean', title: 'Confirmed', const: true } },
        required: ['confirmed'],
      },
    };

    it('draws it as a checkbox rather than a one-option dropdown', () => {
      setState({ form: checkboxForm });

      renderPage();

      expect(jsonFormsProps.schema.properties.confirmed).toEqual({ type: 'boolean', title: 'Confirmed' });
      expect(jsonFormsProps.schema.required).toEqual(['confirmed']);
    });

    it('does not submit when it was ticked and then unticked', async () => {
      setState({ form: checkboxForm });
      renderPage();
      act(() => jsonFormsProps.onChange({ data: { confirmed: false }, errors: [] }));

      await click('access-request-submit');

      expect(submitAccessRequest).not.toHaveBeenCalled();
      expect(jsonFormsProps.additionalErrors).toEqual([
        expect.objectContaining({ instancePath: '/confirmed', message: 'must be checked' }),
      ]);
      expect(invalidCallout()).toHaveTextContent('Confirmed');
    });
  });

  it('submits the answers', async () => {
    renderPage();
    act(() => jsonFormsProps.onChange({ data: { profession: 'nurse' }, errors: [] }));

    await click('access-request-submit');

    expect(submitAccessRequest).toHaveBeenCalledWith({ definitionId: DEFINITION_ID, data: { profession: 'nurse' } });
  });

  it('disables the buttons and the answers while submitting', () => {
    setState({ submitting: true });

    renderPage();

    expect(button('access-request-submit')).toHaveAttribute('disabled', 'true');
    expect(button('access-request-cancel')).toHaveAttribute('disabled', 'true');
    expect(jsonFormsProps.readonly).toBe(true);
  });

  it('shows a submission error and keeps the answers', () => {
    setState({ submitError: 'Form service is not available.' });
    renderPage();
    act(() => jsonFormsProps.onChange({ data: { profession: 'nurse' }, errors: [] }));

    expect(document.querySelector("goa-callout[testid='access-request-error']")).toHaveTextContent(
      'Form service is not available.',
    );
    expect(jsonFormsProps.data).toEqual({ profession: 'nurse' });
  });

  it('confirms a request that was just submitted', async () => {
    mockDispatch.mockResolvedValueOnce({ payload: { request: { status: 'pending' } } });
    const { rerender } = renderPage();
    act(() => jsonFormsProps.onChange({ data: { profession: 'nurse' }, errors: [] }));
    await click('access-request-submit');

    setState({ request: { id: 'request-1', status: 'pending', submittedAt: '2026-11-25T16:00:00Z' } });
    rerender(
      <MemoryRouter>
        <AccessRequest definitionId={DEFINITION_ID} />
      </MemoryRouter>,
    );

    const callout = document.querySelector("goa-callout[testid='access-request-pending']");
    expect(callout).toHaveAttribute('heading', 'Request submitted');
    expect(screen.queryByTestId('questions')).not.toBeInTheDocument();
  });

  it('shows that an earlier request is waiting for review instead of the questions', () => {
    setState({ request: { id: 'request-1', status: 'pending', submittedAt: '2026-11-25T16:00:00Z' } });

    renderPage();

    const callout = document.querySelector("goa-callout[testid='access-request-pending']");
    expect(callout).toHaveAttribute('heading', 'Request waiting for review');
    expect(screen.queryByTestId('questions')).not.toBeInTheDocument();
  });

  it('lets the user request access again after a denied request', () => {
    setState({ request: { id: 'request-1', status: 'denied', submittedAt: '2026-11-25T16:00:00Z' } });

    renderPage();

    expect(document.querySelector("goa-callout[testid='access-request-denied']")).toBeInTheDocument();
    expect(screen.getByTestId('questions')).toBeInTheDocument();
  });

  it('cancels without submitting, and can start again', async () => {
    renderPage();
    act(() => jsonFormsProps.onChange({ data: { profession: 'nurse' }, errors: [] }));

    await click('access-request-cancel');

    expect(document.querySelector("goa-callout[testid='access-request-cancelled']")).toBeInTheDocument();
    expect(submitAccessRequest).not.toHaveBeenCalled();

    await click('access-request-restart');

    expect(jsonFormsProps.data).toEqual({});
  });

  it('says the form does not exist when it does not accept access requests', () => {
    setState({ form: null });

    renderPage();

    expect(screen.getByText(/There is not a form associated with this link/)).toBeInTheDocument();
  });
});

describe('RestrictedForm', () => {
  const renderRestricted = () =>
    render(
      <MemoryRouter initialEntries={[`/autotest/${DEFINITION_ID}`]}>
        <Routes>
          <Route path="/:tenant/:definitionId" element={<RestrictedForm definitionId={DEFINITION_ID} />} />
          <Route path="/:tenant/:definitionId/access-request" element={<div data-testid="access-request-page" />} />
        </Routes>
      </MemoryRouter>,
    );

  it('sends the user to request access when the form accepts access requests', () => {
    renderRestricted();

    expect(screen.getByTestId('access-request-page')).toBeInTheDocument();
  });

  it('says the form does not exist otherwise, as before', () => {
    setState({ form: null });

    renderRestricted();

    expect(screen.queryByTestId('access-request-page')).not.toBeInTheDocument();
    expect(screen.getByText(/There is not a form associated with this link/)).toBeInTheDocument();
  });
});
