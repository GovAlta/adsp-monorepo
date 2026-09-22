import { findSubscribers, getSubscriberSubscriptions } from './sagas';
import { FindSubscribers, GetSubscriberSubscriptions } from './actions';

// Drives the saga as far as the request it makes, and hands back the params it asked for. The saga
// selects the service url and the token before building the request, so both are supplied here.
function paramsForCriteria(criteria) {
  const iterator = findSubscribers(FindSubscribers(criteria));

  iterator.next(); // select the service url
  iterator.next('https://notification.example.co'); // the url, then get the token
  let effect = iterator.next('token'); // the token, then the loading indicator

  // Step past the puts the saga makes before the request until the request itself is reached.
  while (effect.value && !effect.value.payload?.args) {
    effect = iterator.next();
  }

  return effect.value.payload.args[1].params;
}

describe('findSubscribers saga', () => {
  it('asks for a page of the size the caller wants', () => {
    expect(paramsForCriteria({ top: 25 })).toEqual(expect.objectContaining({ top: 25 }));
  });

  it('asks for ten recipients when no size is given', () => {
    expect(paramsForCriteria({})).toEqual(expect.objectContaining({ top: 10 }));
  });

  // The registry searches one value against every field a recipient holds an address in.
  it('passes the search value on', () => {
    expect(paramsForCriteria({ search: 'smith' })).toEqual(expect.objectContaining({ search: 'smith' }));
  });

  it('leaves the search out when nothing was searched for', () => {
    expect(paramsForCriteria({})).not.toHaveProperty('search');
  });

  it('passes the column and direction to sort on', () => {
    expect(paramsForCriteria({ sort: { column: 'email', direction: 'desc' } })).toEqual(
      expect.objectContaining({ sortBy: 'email', sortDirection: 'desc' }),
    );
  });

  it('leaves the sort out when none is chosen', () => {
    const params = paramsForCriteria({});
    expect(params).not.toHaveProperty('sortBy');
    expect(params).not.toHaveProperty('sortDirection');
  });

  it('asks for the page the cursor points at', () => {
    expect(paramsForCriteria({ next: 'cursor' })).toEqual(expect.objectContaining({ after: 'cursor' }));
  });

  it('starts from the first page when the paging is reset', () => {
    expect(paramsForCriteria({ next: 'cursor', paginationReset: true })).toEqual(
      expect.objectContaining({ after: null }),
    );
  });

  it('still supports searching a single field on its own', () => {
    expect(paramsForCriteria({ name: 'user-a', email: 'a@test.co', sms: '780' })).toEqual(
      expect.objectContaining({ name: 'user-a', email: 'a@test.co', sms: '780' }),
    );
  });
});

describe('getSubscriberSubscriptions saga', () => {
  it('asks for the selected subscriber\'s subscriptions', () => {
    const iterator = getSubscriberSubscriptions(GetSubscriberSubscriptions({ id: 'subscriber-1' }, null));

    iterator.next(); // select the service url
    iterator.next('https://notification.example.co'); // the url, then get the token
    const effect = iterator.next('token'); // the token, then the request

    expect(effect.value.payload.args[0]).toBe('https://notification.example.co/subscription/v1/subscribers/subscriber-1/subscriptions');
  });
});
