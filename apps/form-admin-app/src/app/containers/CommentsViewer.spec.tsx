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
  deleteComment: jest.fn(),
  draftSelector: () => ({ content: '' }),
  loadComments: jest.fn(),
  selectedTopicSelector: () => null,
  userSelector: () => ({ user: { id: 'reviewer-1' } }),
}));

const { CommentsViewer } = require('./CommentsViewer');

describe('form-admin-app CommentsViewer', () => {
  // The heading and the field placeholder already say what the field is for, so the label above it
  // was only taking height from the conversation.
  it('labels the send button "Send" and drops the label above the draft field', () => {
    render(<CommentsViewer />);

    expect(capturedProps.addCommentButtonLabel).toBe('Send');
    expect(capturedProps.hideAddCommentLabel).toBe(true);
    expect(capturedProps.addCommentLabel).toBeUndefined();
  });

  it('renders the review conversation with the messaging layout', () => {
    const { getByTestId } = render(<CommentsViewer />);

    expect(getByTestId('comments-viewer')).toBeInTheDocument();
    expect(capturedProps.messaging).toBe(true);
  });
});
