import axios from 'axios';
import { addComment, commentReducer, commentsSelector, deleteComment, loadComments, selectTopic } from './comment.slice';

// babel-jest hoists these above the import; the slice creates an axios client and a socket at
// module load, and neither is exercised by reducer and selector tests.
jest.mock('axios');
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('./user.slice', () => ({ getAccessToken: jest.fn(async () => 'token') }));

type CommentState = ReturnType<typeof commentReducer>;

const topicA = { id: 1, resourceId: 'urn:form:a', name: 'Form A', typeId: 'form-questions', requiresAttention: false };
const topicB = { id: 2, resourceId: 'urn:form:b', name: 'Form B', typeId: 'form-questions', requiresAttention: false };

const comment = (id: number, content: string) => ({
  id,
  content,
  createdOn: '2026-08-20T12:00:00Z',
  createdBy: { id: 'user-1', name: 'Tester' },
});

function stateWith(overrides: Partial<CommentState> = {}): CommentState {
  const initial = commentReducer(undefined, { type: '@@INIT' });
  return { ...initial, ...overrides } as CommentState;
}

function loadedState(topic: typeof topicA, comments: ReturnType<typeof comment>[]): CommentState {
  return stateWith({
    topics: { [topic.resourceId]: topic },
    selected: { resourceId: topic.resourceId, canRead: true, canComment: true },
    comments: { topicId: topic.id, results: comments, next: null },
  });
}

describe('commentReducer', () => {
  describe('loadComments', () => {
    it('should clear comments of another topic when loading a page', () => {
      const state = commentReducer(
        loadedState(topicA, [comment(10, 'from form A')]),
        loadComments.pending('req', { topic: topicB, after: 'page-2' }),
      );

      expect(state.comments.topicId).toBe(topicB.id);
      expect(state.comments.results).toEqual([]);
    });

    it('should append a page of the topic already loaded', () => {
      let state = loadedState(topicA, [comment(10, 'from form A')]);
      state = commentReducer(state, loadComments.pending('req', { topic: topicA, after: 'page-2' }));
      state = commentReducer(
        state,
        loadComments.fulfilled({ results: [comment(11, 'also form A')], page: {} }, 'req', {
          topic: topicA,
          after: 'page-2',
        }),
      );

      expect(state.comments.results.map((r) => r.id)).toEqual([10, 11]);
    });

    it('should replace rather than append when refreshing without a cursor', () => {
      // The socket refresh after a new comment reloads the first page with no cursor; appending it
      // duplicated every message already on screen.
      let state = loadedState(topicA, [comment(10, 'from form A')]);
      state = commentReducer(
        state,
        loadComments.fulfilled(
          { results: [comment(11, 'the new one'), comment(10, 'from form A')], page: {} },
          'req',
          { topic: topicA },
        ),
      );

      expect(state.comments.results.map((r) => r.id)).toEqual([11, 10]);
    });

    it('should ignore a response for a topic that is no longer loaded', () => {
      let state = loadedState(topicB, []);
      state = commentReducer(state, loadComments.pending('req-b', { topic: topicB }));
      state = commentReducer(
        state,
        loadComments.fulfilled({ results: [comment(10, 'from form A')], page: {} }, 'req-a', { topic: topicA }),
      );

      expect(state.comments.topicId).toBe(topicB.id);
      expect(state.comments.results).toEqual([]);
    });
  });

  describe('selectTopic', () => {
    it('should clear comments when selecting a form with no topic', () => {
      const state = commentReducer(
        loadedState(topicA, [comment(10, 'from form A')]),
        selectTopic.fulfilled({ canComment: false, canRead: false }, 'req', { resourceId: 'urn:form:c' }),
      );

      expect(state.comments.topicId).toBeNull();
      expect(state.comments.results).toEqual([]);
    });

    it('should keep comments loaded for the topic being selected', () => {
      // selectTopic dispatches loadComments before it fulfills, so the new topic's comments are
      // already in state by the time the selection is recorded.
      let state = stateWith({ topics: { [topicB.resourceId]: topicB } });
      state = commentReducer(state, loadComments.pending('req', { topic: topicB }));
      state = commentReducer(
        state,
        loadComments.fulfilled({ results: [comment(20, 'from form B')], page: {} }, 'req', { topic: topicB }),
      );
      state = commentReducer(
        state,
        selectTopic.fulfilled({ canComment: true, canRead: true }, 'req', { resourceId: topicB.resourceId }),
      );

      expect(state.comments.results.map((r) => r.id)).toEqual([20]);
    });
  });

  describe('addComment', () => {
    it('should add the comment to the list of its own topic', () => {
      const state = commentReducer(
        loadedState(topicA, [comment(10, 'from form A')]),
        addComment.fulfilled(comment(11, 'new'), 'req', { topic: topicA, comment: { content: 'new' } }),
      );

      expect(state.comments.results.map((r) => r.id)).toEqual([11, 10]);
    });

    it('should not add the comment to a list of another topic', () => {
      const state = commentReducer(
        loadedState(topicA, [comment(10, 'from form A')]),
        addComment.fulfilled(comment(20, 'new'), 'req', { topic: topicB, comment: { content: 'new' } }),
      );

      expect(state.comments.results.map((r) => r.id)).toEqual([10]);
    });
  });

  describe('deleteComment', () => {
    it('should not remove a comment of the same id from another topic', () => {
      const state = commentReducer(
        loadedState(topicA, [comment(10, 'from form A')]),
        deleteComment.fulfilled({ deleted: true }, 'req', { topicId: topicB.id, commentId: 10 }),
      );

      expect(state.comments.results.map((r) => r.id)).toEqual([10]);
    });
  });
});

describe('commentsSelector', () => {
  const select = (comment: CommentState) =>
    commentsSelector({ comment, user: { user: { id: 'user-1' } } } as Parameters<typeof commentsSelector>[0]);

  it('should return comments loaded for the selected topic', () => {
    expect(select(loadedState(topicA, [comment(10, 'from form A')])).results.map((r) => r.id)).toEqual([10]);
  });

  it('should not return comments loaded for another topic', () => {
    const state = loadedState(topicA, [comment(10, 'from form A')]);
    const { results, next } = select({
      ...state,
      topics: { ...state.topics, [topicB.resourceId]: topicB },
      selected: { ...state.selected, resourceId: topicB.resourceId },
      comments: { ...state.comments, next: 'page-2' },
    });

    expect(results).toEqual([]);
    expect(next).toBeNull();
  });
});

describe('addComment', () => {
  const directoryState = {
    config: {
      directory: {
        'urn:ads:platform:comment-service': 'https://comment-service',
        'urn:ads:platform:notification-service': 'https://notification-service',
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = () => addComment({ topic: topicA, comment: { content: 'A reply' } })(jest.fn(), () => directoryState as any, undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  // A reviewer isn't recorded against a form, so replying is what makes them reachable by email.
  it('should subscribe the replying reviewer for messages on the form', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: comment(1, 'A reply') });

    await run();

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/subscription/v1/types/form-message-reviewer-notifications/subscriptions'),
      expect.objectContaining({ criteria: expect.objectContaining({ correlationId: topicA.resourceId }) }),
      expect.objectContaining({ params: { userSub: true } }),
    );
  });

  it('should keep the reply when subscribing fails', async () => {
    (axios.post as jest.Mock)
      .mockResolvedValueOnce({ data: comment(1, 'A reply') })
      .mockRejectedValueOnce(new Error('no subscription for you'));

    const result = await run();

    expect(result.type).toBe('comment/add-comment/fulfilled');
  });
});
