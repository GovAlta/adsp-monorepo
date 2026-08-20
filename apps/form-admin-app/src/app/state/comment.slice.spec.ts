jest.mock('axios');
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

import { addComment, commentReducer, commentsSelector, deleteComment, loadComments, selectTopic } from './comment.slice';

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
