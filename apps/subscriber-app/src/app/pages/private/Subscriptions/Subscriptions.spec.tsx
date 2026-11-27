import { render, screen } from '@testing-library/react';
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
jest.mock('@lib/wrappers', () => ({ phoneWrapper: (value: string) => value }), { virtual: true });
jest.mock('./ContactInfoCard', () => ({ ContactInfoCard: () => <div /> }));
jest.mock(
  '@store/notification/actions',
  () => ({ FetchContactInfoService: (payload) => ({ type: 'notification/contact', payload }) }),
  { virtual: true },
);
jest.mock(
  '@store/tenant/actions',
  () => ({ KeycloakCheckSSOWithLogout: (realm: string) => ({ type: 'tenant/check-sso', payload: realm }) }),
  { virtual: true },
);
jest.mock(
  '@store/subscription/actions',
  () => ({
    getMySubscriberDetails: () => ({ type: 'subscription/mine' }),
    unsubscribe: (payload) => ({ type: 'subscription/unsubscribe', payload }),
    CheckCode: (channel: string, code: string) => ({ type: 'subscription/check-code', payload: { channel, code } }),
  }),
  { virtual: true },
);

const subscriber = { id: 'sub-1', subscriptions: [{ typeId: 'type-1' }] };

const renderAt = (path: string, subscription: Record<string, unknown>, session: Record<string, unknown> = {}) => {
  const store = configureStore()({
    subscription: { subscriber: null, hasSubscriberId: true, previouslyVerified: {}, ...subscription },
    notification: {},
    session,
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/subscriptions/:realm" element={<Subscriptions realm="my-realm" />} />
          <Route path="/subscriptions/:realm/verified" element={<div data-testid="verified" />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('private Subscriptions', () => {
  it('checks SSO for the realm on load', () => {
    const store = renderAt('/subscriptions/my-realm', {});
    expect(store.getActions()).toEqual([{ type: 'tenant/check-sso', payload: 'my-realm' }]);
  });

  it('loads subscriber details and checks the email code from the query once user info is ready', () => {
    const store = renderAt('/subscriptions/my-realm?code=abc', { subscriber }, { userInfo: {} });
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        { type: 'subscription/mine' },
        { type: 'notification/contact', payload: { realm: 'my-realm' } },
        { type: 'subscription/check-code', payload: { channel: 'email', code: 'abc' } },
      ]),
    );
    expect(screen.getByTestId('subscriptions-list')).toBeTruthy();
  });

  it('checks the sms code from the query', () => {
    const store = renderAt('/subscriptions/my-realm?smscode=123', { subscriber }, { userInfo: {} });
    expect(store.getActions()).toContainEqual({
      type: 'subscription/check-code',
      payload: { channel: 'sms', code: '123' },
    });
  });

  it('shows the no subscriptions callout without a subscriber id', () => {
    renderAt('/subscriptions/my-realm', { hasSubscriberId: false });
    expect(document.querySelector('goa-callout[heading="You have no subscriptions"]')).toBeTruthy();
  });
});
