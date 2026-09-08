import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedProps: any;

jest.mock('@core-services/app-common', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CommentsViewer: (props: any) => {
    capturedProps = props;
    return <div data-testid="comments-viewer" />;
  },
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: () => unknown) => selector(),
  useDispatch: () => jest.fn(),
}));

jest.mock('../state', () => ({
  addComment: jest.fn(),
  canCommentSelector: () => true,
  commentActions: { setDraftComment: jest.fn() },
  commentExecutingSelector: () => false,
  commentLoadingSelector: () => false,
  commentsSelector: () => ({ results: [], next: null }),
  draftSelector: () => ({ content: '' }),
  loadComments: jest.fn(),
  selectedTopicSelector: () => null,
}));

const { CommentsViewer } = require('./CommentsViewer');

describe('form-app CommentsViewer', () => {
  it('labels the send button "Send" while the draft field keeps its own label', () => {
    render(<CommentsViewer />);

    expect(capturedProps.addCommentButtonLabel).toBe('Send');
    expect(capturedProps.addCommentLabel).toBe('Add question');
  });

  it('renders the questions conversation with the messaging layout', () => {
    const { getByTestId } = render(<CommentsViewer />);

    expect(getByTestId('comments-viewer')).toBeInTheDocument();
    expect(capturedProps.messaging).toBe(true);
  });
});
