import {
  DeleteSubscriber,
  DELETE_SUBSCRIBER,
  FindSubscribers,
  FindSubscribersSuccess,
  FIND_SUBSCRIBERS,
  FIND_SUBSCRIBERS_SUCCESS,
  UpdateSubscriber,
  UPDATE_SUBSCRIBER,
} from './actions';

describe('FindSubscribers', () => {
  it('carries the criteria to search on', () => {
    const criteria = { top: 10, search: 'smith', sort: { column: 'email' as const, direction: 'asc' as const } };

    expect(FindSubscribers(criteria)).toEqual({ type: FIND_SUBSCRIBERS, payload: criteria });
  });
});

describe('FindSubscribersSuccess', () => {
  const subscribers = [{ id: 'a', addressAs: 'user-a' }];

  it('carries the results and the cursor for the page that follows', () => {
    expect(FindSubscribersSuccess(subscribers, 'next-cursor')).toEqual({
      type: FIND_SUBSCRIBERS_SUCCESS,
      payload: { subscribers, next: 'next-cursor', after: undefined, total: undefined },
    });
  });

  // The registry reports how many recipients match, not just how many came back on the page.
  it('carries the total matching the search', () => {
    expect(FindSubscribersSuccess(subscribers, null, 'after-cursor', 34).payload).toEqual(
      expect.objectContaining({ after: 'after-cursor', total: 34 }),
    );
  });
});

describe('UpdateSubscriber', () => {
  it('carries the subscriber to update', () => {
    const subscriber = { id: 'a', addressAs: 'user-a' };

    expect(UpdateSubscriber(subscriber)).toEqual({ type: UPDATE_SUBSCRIBER, payload: { subscriber } });
  });
});

describe('DeleteSubscriber', () => {
  it('carries the id of the subscriber to delete', () => {
    expect(DeleteSubscriber('subscriber-1')).toEqual({
      type: DELETE_SUBSCRIBER,
      payload: { subscriberId: 'subscriber-1' },
    });
  });
});
