import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any;
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: (state: any) => unknown) => selector(mockState),
  useDispatch: () => mockDispatch,
}));

// The thunks are stubbed so the dispatches this container makes can be told apart.
jest.mock('../state', () => ({
  ...jest.requireActual('../state'),
  loadForm: jest.fn(() => ({ type: 'load-form' })),
  disconnectStream: jest.fn(() => ({ type: 'disconnect-stream' })),
  setShowMessages: jest.fn((show: boolean) => ({ type: 'set-show-messages', payload: show })),
}));

jest.mock('../components/DraftFormWrapper', () => ({ DraftFormWrapper: () => <div /> }));
jest.mock('../components/LogoutModal', () => ({ LogoutModal: () => <div /> }));
jest.mock('../components/SubmittedForm', () => ({ SubmittedForm: () => <div /> }));
jest.mock('../components/UserNotAuthorized', () => ({ UserNotAuthorized: () => <div /> }));
jest.mock('./FormSupportPane', () => ({ FormSupportPane: () => <div data-testid="support-pane" /> }));

const { Form } = require('./Form');

const definition = { id: 'abc111232', name: 'abc111232', dataSchema: {}, uiSchema: { type: 'Categorization' } };

beforeEach(() => {
  mockDispatch.mockClear();
  mockState = {
    form: {
      selected: definition.id,
      definitions: { [definition.id]: definition },
      form: null,
      data: {},
      files: {},
      errors: [],
      busy: { loading: false, saving: false, submitting: false },
    },
    file: { busy: { loaded: true, metadata: {}, download: {} } },
  };
});

const renderForm = () =>
  render(
    <MemoryRouter>
      <Form />
    </MemoryRouter>,
  );

describe('Form', () => {
  it('loads the form it is showing', () => {
    renderForm();

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'load-form' });
  });

  // The drawer visibility is shared state now, so leaving the form has to close it or it would be
  // open again on the next form.
  it('closes the messages drawer on the way out', () => {
    const { unmount } = renderForm();
    mockDispatch.mockClear();

    unmount();

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'disconnect-stream' });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'set-show-messages', payload: false });
  });
});
