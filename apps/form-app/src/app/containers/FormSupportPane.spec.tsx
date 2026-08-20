import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: (state: any) => unknown) => selector(mockState),
  useDispatch: () => jest.fn(),
}));

// The agent connection check is a socket handshake; the pane only needs it to stay unconnected here.
jest.mock('socket.io-client', () => ({ io: () => ({ on: jest.fn(), disconnect: jest.fn() }) }));
jest.mock('./CommentsViewer', () => ({
  __esModule: true,
  default: () => <div data-testid="comments-viewer" />,
}));
jest.mock('./FormAgentChat', () => ({ FormAgentChat: () => <div data-testid="agent-chat" /> }));

const { FormSupportPane } = require('./FormSupportPane');

const FORM = { id: 'form-1', urn: 'urn:form-1', definition: { id: 'abc111232' } };
const TOPIC = { resourceId: FORM.urn, id: 12, name: 'form-1', commenters: [] };

const stateWith = ({ topic = TOPIC, show = false } = {}) => ({
  config: { directory: {} },
  user: { user: { id: 'applicant' } },
  comment: {
    topics: topic ? { [topic.resourceId]: topic } : {},
    selected: { resourceId: topic?.resourceId ?? null },
    messages: { show, unread: 0, latestCommentId: 0, lastReadCommentId: 0 },
  },
});

const renderPane = () => render(<FormSupportPane form={FORM} data={{}} files={{}} />);

describe('FormSupportPane', () => {
  // The drawer is opened from the header now, so it follows the shared messages state.
  it('stays closed while messages are not shown', () => {
    mockState = stateWith({ show: false });

    const { container } = renderPane();

    expect(container.querySelector('[data-show]')).toHaveAttribute('data-show', 'false');
  });

  it('opens on the questions when messages are shown', () => {
    mockState = stateWith({ show: true });

    const { container, getByTestId } = renderPane();

    expect(container.querySelector('[data-show]')).toHaveAttribute('data-show', 'true');
    expect(getByTestId('comments-viewer')).toBeInTheDocument();
  });

  // CS-5275 removed the '?' launcher from the bottom left of the form.
  it('has no support launcher of its own', () => {
    mockState = stateWith({ show: false });

    const { container } = renderPane();

    expect(container.querySelector('goa-icon-button')).toBeNull();
  });
});
