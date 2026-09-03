import '@testing-library/jest-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  addComment,
  commentReducer,
  connectStream,
  loadComments,
  loadUnreadMessages,
  selectTopic,
  setShowMessages,
} from './comment.slice';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('socket.io-client', () => ({ io: jest.fn() }));
const ioMock = io as jest.MockedFunction<typeof io>;

const COMMENT_SERVICE_URL = 'https://comment-service';
const PUSH_SERVICE_URL = 'https://push-service';
const TOPIC = { resourceId: 'urn:ads:platform:form-service:v1:/forms/form-1', id: 12, name: 'form-1', commenters: [] };

const initialState = commentReducer(undefined, { type: 'unknown' });

const stateWithTopic = {
  ...initialState,
  topics: { [TOPIC.resourceId]: TOPIC },
  selected: { ...initialState.selected, resourceId: TOPIC.resourceId },
};

const getState =
  (comment: unknown = stateWithTopic) =>
  () =>
    ({
      config: {
        directory: {
          'urn:ads:platform:comment-service': COMMENT_SERVICE_URL,
          'urn:ads:platform:push-service': PUSH_SERVICE_URL,
        },
      },
      user: { user: { id: 'applicant' } },
      comment,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

describe('comment slice messages', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('loadUnreadMessages', () => {
    it('counts comments the applicant did not write', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          results: [
            { id: 8, createdBy: { id: 'assessor' } },
            { id: 7, createdBy: { id: 'applicant' } },
            { id: 6, createdBy: { id: 'assessor' } },
          ],
        },
      });

      const { payload } = await loadUnreadMessages({ topicId: TOPIC.id })(jest.fn(), getState(), undefined);

      expect(payload).toEqual({ lastReadCommentId: 0, latestCommentId: 8, unread: 2 });
    });

    // Everything newer than the last comment seen when the drawer was open is unread.
    it('only asks for comments newer than the last read one', async () => {
      localStorage.setItem(`form-app.messages.last-read.${TOPIC.id}`, '5');
      axiosMock.get.mockResolvedValue({ data: { results: [] } });

      const { payload } = await loadUnreadMessages({ topicId: TOPIC.id })(jest.fn(), getState(), undefined);

      expect(axiosMock.get).toHaveBeenCalledWith(
        `${COMMENT_SERVICE_URL}/comment/v1/topics/${TOPIC.id}/comments`,
        expect.objectContaining({
          params: expect.objectContaining({ criteria: JSON.stringify({ idGreaterThan: 5 }) }),
        }),
      );
      expect(payload).toEqual({ lastReadCommentId: 5, latestCommentId: 5, unread: 0 });
    });

    it('keeps the previous count when the request fails', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { show: false, latestCommentId: 40, lastReadCommentId: 38, unread: 2 } },
        { type: loadUnreadMessages.fulfilled.type, payload: null },
      );

      expect(state.messages).toEqual({ show: false, latestCommentId: 40, lastReadCommentId: 38, unread: 2 });
    });

    // Anything that arrives while the drawer is open has been read as it came in, and the id has to
    // be recorded so a reload doesn't count it again.
    it('marks arriving messages read while the drawer is open', async () => {
      const comment = { ...stateWithTopic, messages: { ...initialState.messages, show: true } };
      axiosMock.get.mockResolvedValue({ data: { results: [{ id: 8, createdBy: { id: 'assessor' } }] } });

      await loadUnreadMessages({ topicId: TOPIC.id })(jest.fn(), getState(comment), undefined);

      expect(localStorage.getItem(`form-app.messages.last-read.${TOPIC.id}`)).toBe('8');
    });

    it('stays clear when the drawer was opened while loading', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { ...initialState.messages, show: true } },
        { type: loadUnreadMessages.fulfilled.type, payload: { lastReadCommentId: 5, latestCommentId: 8, unread: 2 } },
      );

      expect(state.messages.unread).toBe(0);
    });

    it('records the unread count', () => {
      const state = commentReducer(stateWithTopic, {
        type: loadUnreadMessages.fulfilled.type,
        payload: { lastReadCommentId: 5, latestCommentId: 8, unread: 2 },
      });

      expect(state.messages).toEqual(expect.objectContaining({ unread: 2, lastReadCommentId: 5, latestCommentId: 8 }));
    });
  });

  describe('selectTopic', () => {
    // Message ids are per topic, so what was tracked for a previously opened form has to go.
    it('drops the counts of the previous form', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { show: false, latestCommentId: 40, lastReadCommentId: 38, unread: 2 } },
        {
          type: selectTopic.fulfilled.type,
          meta: { arg: { resourceId: 'urn:ads:platform:form-service:v1:/forms/form-2' } },
          payload: { canRead: true, canComment: true },
        },
      );

      expect(state.messages).toEqual({ show: false, latestCommentId: 0, lastReadCommentId: 0, unread: 0 });
    });

    it('keeps the counts when the same form is selected again', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { show: false, latestCommentId: 40, lastReadCommentId: 38, unread: 2 } },
        {
          type: selectTopic.fulfilled.type,
          meta: { arg: { resourceId: TOPIC.resourceId } },
          payload: { canRead: true, canComment: true },
        },
      );

      expect(state.messages).toEqual({ show: false, latestCommentId: 40, lastReadCommentId: 38, unread: 2 });
    });
  });

  describe('setShowMessages', () => {
    it('remembers the latest comment so it is not counted again', async () => {
      const comment = { ...stateWithTopic, messages: { ...initialState.messages, latestCommentId: 8, unread: 2 } };

      const { payload } = await setShowMessages(true)(jest.fn(), getState(comment), undefined);

      expect(payload).toBe(true);
      expect(localStorage.getItem(`form-app.messages.last-read.${TOPIC.id}`)).toBe('8');
    });

    it('does not mark messages read on close', async () => {
      const comment = { ...stateWithTopic, messages: { ...initialState.messages, latestCommentId: 8, unread: 2 } };

      await setShowMessages(false)(jest.fn(), getState(comment), undefined);

      expect(localStorage.getItem(`form-app.messages.last-read.${TOPIC.id}`)).toBeNull();
    });

    it('clears the unread count when the drawer is opened', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { ...initialState.messages, latestCommentId: 8, unread: 2 } },
        { type: setShowMessages.fulfilled.type, payload: true },
      );

      expect(state.messages).toEqual(expect.objectContaining({ show: true, unread: 0, lastReadCommentId: 8 }));
    });

    it('leaves the unread count alone when the drawer is closed', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { show: true, latestCommentId: 8, lastReadCommentId: 8, unread: 0 } },
        { type: setShowMessages.fulfilled.type, payload: false },
      );

      expect(state.messages).toEqual(expect.objectContaining({ show: false, lastReadCommentId: 8 }));
    });
  });

  // The stream event carries no author, so the count is refreshed from the service instead.
  it('refreshes the unread count when a comment arrives on the stream', async () => {
    const handlers: Record<string, (update: { topic: typeof TOPIC }) => void> = {};
    ioMock.mockReturnValue({
      connected: false,
      disconnect: jest.fn(),
      on: (event: string, handler: (update: { topic: typeof TOPIC }) => void) => {
        handlers[event] = handler;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    axiosMock.get.mockResolvedValue({ data: { results: [], page: {} } });

    // Stands in for the thunk middleware so the dispatches the handler makes actually run.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatch: any = jest.fn((action: unknown) =>
      typeof action === 'function' ? action(dispatch, getState(), undefined) : action,
    );

    await connectStream({ stream: 'form-questions-updates', typeId: 'form-questions', topicId: TOPIC.id })(
      dispatch,
      getState(),
      undefined,
    );
    axiosMock.get.mockClear();

    handlers['comment-service:comment-created']({ topic: TOPIC });
    await new Promise(process.nextTick);

    expect(axiosMock.get).toHaveBeenCalledWith(
      `${COMMENT_SERVICE_URL}/comment/v1/topics/${TOPIC.id}/comments`,
      expect.objectContaining({ params: expect.objectContaining({ top: 100 }) }),
    );
  });

  // The socket refresh after a new comment reloads the first page with no cursor; appending it
  // duplicated every message already on screen.
  it('replaces rather than appends when refreshing without a cursor', () => {
    const loaded = commentReducer(stateWithTopic, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 8, content: 'first' }], page: {} },
      meta: { arg: { topic: TOPIC } },
    });

    const refreshed = commentReducer(loaded, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 9, content: 'second' }, { id: 8, content: 'first' }], page: {} },
      meta: { arg: { topic: TOPIC } },
    });

    expect(refreshed.comments.results.map((r) => r.id)).toEqual([9, 8]);
  });

  it('still appends when loading an older page with a cursor', () => {
    const loaded = commentReducer(stateWithTopic, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 9, content: 'newer' }], page: {} },
      meta: { arg: { topic: TOPIC } },
    });

    const paged = commentReducer(loaded, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 8, content: 'older' }], page: {} },
      meta: { arg: { topic: TOPIC, next: 'page-2' } },
    });

    expect(paged.comments.results.map((r) => r.id)).toEqual([9, 8]);
  });

  // The refresh the comment-created event triggers can land before the post resolves, and the
  // message was then held twice with nothing to take the second copy away.
  it('does not add a posted comment the refresh already brought in', () => {
    const loaded = commentReducer(stateWithTopic, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 9, content: 'mine' }], page: {} },
      meta: { arg: { topic: TOPIC } },
    });

    const posted = commentReducer(loaded, {
      type: addComment.fulfilled.type,
      payload: { id: 9, content: 'mine' },
    });

    expect(posted.comments.results.map((r) => r.id)).toEqual([9]);
  });

  it('adds a posted comment the refresh has not brought in', () => {
    const loaded = commentReducer(stateWithTopic, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 8, content: 'theirs' }], page: {} },
      meta: { arg: { topic: TOPIC } },
    });

    const posted = commentReducer(loaded, {
      type: addComment.fulfilled.type,
      payload: { id: 9, content: 'mine' },
    });

    expect(posted.comments.results.map((r) => r.id)).toEqual([9, 8]);
  });

  // Comments loaded into the drawer are what the next open marks as read.
  it('tracks the latest comment loaded into the drawer', () => {
    const state = commentReducer(stateWithTopic, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 9 }, { id: 8 }], page: {} },
    });

    expect(state.messages.latestCommentId).toBe(9);
  });
});
