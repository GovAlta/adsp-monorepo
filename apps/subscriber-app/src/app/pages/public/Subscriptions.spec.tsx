import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Subscriptions from './Subscriptions';

jest.mock('@components/Html', () => ({ Main: ({ children }) => <main>{children}</main> }), { virtual: true });
jest.mock('@components/DataTable', () => ({ children }) => <table>{children}</table>, { virtual: true });
jest.mock('@components/SubscriptionsList', () => () => <tr data-testid="subscriptions-list" />, { virtual: true });
jest.mock('@core-services/app-common', () => ({
  Container: ({ children }) => <div>{children}</div>,
  TextGoASkeleton: () => <div />,
}));
jest.mock(
  '@store/notification/actions',
  () => ({ FetchContactInfoService: (payload) => ({ type: 'notification/contact', payload }) }),
  { virtual: true },
);
jest.mock(
  '@store/tenant/actions',
  () => ({ FetchTenantService: (payload) => ({ type: 'tenant/fetch', payload }) }),
  { virtual: true },
);
jest.mock('@store/subscription/models', () => ({ Channels: { email: 'email', sms: 'sms' }, expireMinutes: 10 }), {
  virtual: true,
});
jest.mock(
  '@store/subscription/actions',
  () => ({
    getSubscriberDetails: (id: string) => ({ type: 'subscription/details', payload: id }),
    signedOutUnsubscribe: (payload) => ({ type: 'subscription/unsubscribe', payload }),
    CheckCode: (channel: string, code: string) => ({ type: 'subscription/check-code', payload: { channel, code } }),
    VerifyEmail: (payload) => ({ type: 'subscription/verify-email', payload }),
  }),
  { virtual: true },
);

const subscriber = {
  id: 'sub-1',
  tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1',
  channels: [{ channel: 'email', address: 'a@b.c', verified: true }],
  subscriptions: [],
};

const renderAt = (path: string, subscription: Record<string, unknown> = {}) => {
  const store = configureStore()({
    subscription: { subscriber: null, previouslyVerified: {}, ...subscription },
    notification: {},
    session: {},
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:subscriberId" element={<Subscriptions />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('public Subscriptions', () => {
  it('loads the subscriber from the route param', () => {
    const store = renderAt('/sub-1');
    expect(store.getActions()).toEqual([{ type: 'subscription/details', payload: 'sub-1' }]);
  });

  it('loads tenant contact info and checks the email code from the query', () => {
    const store = renderAt('/sub-1?code=abc', { subscriber });
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        { type: 'notification/contact', payload: { tenantId: 'tenant-1' } },
        { type: 'tenant/fetch', payload: { tenantId: 'tenant-1' } },
        { type: 'subscription/check-code', payload: { channel: 'email', code: 'abc' } },
      ]),
    );
  });

  it('does not check a code of "null"', () => {
    const store = renderAt('/sub-1?code=null', { subscriber });
    expect(store.getActions().map((action) => action.type)).not.toContain('subscription/check-code');
  });
});
