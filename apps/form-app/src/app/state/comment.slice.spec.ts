import '@testing-library/jest-dom';
import axios from 'axios';
import { commentReducer, loadComments, loadUnreadMessages, setShowMessages } from './comment.slice';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const COMMENT_SERVICE_URL = 'https://comment-service';
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
      config: { directory: { 'urn:ads:platform:comment-service': COMMENT_SERVICE_URL } },
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

    // Message ids are per topic, so what was tracked for a previously opened form has to go.
    it('drops the counts of the previous form', () => {
      const state = commentReducer(
        { ...stateWithTopic, messages: { show: false, latestCommentId: 40, lastReadCommentId: 38, unread: 2 } },
        { type: loadUnreadMessages.pending.type },
      );

      expect(state.messages).toEqual({ show: false, latestCommentId: 0, lastReadCommentId: 0, unread: 0 });
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

  // Comments loaded into the drawer are what the next open marks as read.
  it('tracks the latest comment loaded into the drawer', () => {
    const state = commentReducer(stateWithTopic, {
      type: loadComments.fulfilled.type,
      payload: { results: [{ id: 9 }, { id: 8 }], page: {} },
    });

    expect(state.messages.latestCommentId).toBe(9);
  });
});
