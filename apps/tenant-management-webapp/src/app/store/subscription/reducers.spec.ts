import subscriptionReducer from './reducers';
import { FindSubscribersSuccess } from './actions';
import { SUBSCRIBER_INIT } from './models';

describe('subscription reducer', () => {
  describe('on finding subscribers', () => {
    const subscriberA = { id: 'a', addressAs: 'user-a' };
    const subscriberB = { id: 'b', addressAs: 'user-b' };

    it('holds the results of the search', () => {
      const state = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA, subscriberB], null));

      expect(state.subscriberSearch.results).toEqual(['a', 'b']);
      expect(state.subscribers).toEqual({ a: subscriberA, b: subscriberB });
    });

    // The registry shows how many recipients are showing out of the total, which is the count of
    // everything matching the search rather than of the page that came back.
    it('holds the total matching the search', () => {
      const state = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA], null, undefined, 34));

      expect(state.subscriberSearch.total).toBe(34);
    });

    it('treats a missing total as none rather than leaving it undefined', () => {
      const state = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA], null));

      expect(state.subscriberSearch.total).toBe(0);
    });

    it('replaces the previous results when a fresh search is run', () => {
      const first = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA], 'next-cursor'));
      const second = subscriptionReducer(first, FindSubscribersSuccess([subscriberB], null));

      expect(second.subscriberSearch.results).toEqual(['b']);
    });

    // The registry pages with Previous/Next buttons, so a further page replaces what is shown
    // rather than being appended to it.
    it('replaces the previous results when a further page is loaded', () => {
      const first = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA], 'next-cursor'));
      const second = subscriptionReducer(first, FindSubscribersSuccess([subscriberB], null, 'next-cursor'));

      expect(second.subscriberSearch.results).toEqual(['b']);
    });

    it('clears the results when the search is reset', () => {
      const first = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA], 'next-cursor'));
      const reset = subscriptionReducer(first, FindSubscribersSuccess(null, '', undefined, 0));

      expect(reset.subscriberSearch.results).toBeNull();
      expect(reset.subscriberSearch.total).toBe(0);
    });

    it('carries the cursor for the page that follows', () => {
      const state = subscriptionReducer(SUBSCRIBER_INIT, FindSubscribersSuccess([subscriberA], 'next-cursor'));

      expect(state.subscriberSearch.next).toBe('next-cursor');
    });
  });
});
