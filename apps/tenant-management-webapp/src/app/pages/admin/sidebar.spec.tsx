import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Sidebar from './sidebar';
import { APP_SCROLL_CONTAINER_ID } from '@lib/scrollAppToTop';

const mockStore = configureStore([]);
const initialState = {
  tenant: { name: 'test-tenant' },
  // Task is off in defaultFeaturesVisible; the ticket's environment has it enabled.
  config: { featureFlags: { Task: true } },
  session: {
    authenticated: true,
    realm: 'test',
    resourceAccess: { 'urn:ads:platform:tenant-service': { roles: ['tenant-admin'] } },
  },
};

// jsdom has no layout, so a real element's scrollTop always reads back as 0.
// Back it with a stored value so the reset is actually observable.
const addScrollContainer = (startingScrollTop: number) => {
  const container = document.createElement('div');
  container.id = APP_SCROLL_CONTAINER_ID;
  let scrollTop = startingScrollTop;
  Object.defineProperty(container, 'scrollTop', {
    get: () => scrollTop,
    set: (value) => {
      scrollTop = value;
    },
    configurable: true,
  });
  document.body.appendChild(container);
  return container;
};

describe('Sidebar', () => {
  afterEach(() => {
    document.getElementById(APP_SCROLL_CONTAINER_ID)?.remove();
  });

  const renderSidebar = () =>
    render(
      <Provider store={mockStore(initialState)}>
        <MemoryRouter>
          <Sidebar type="desktop" />
        </MemoryRouter>
      </Provider>,
    );

  it.each([
    ['menu-task', 'a service'],
    ['menu-value', 'a second service'],
    ['menu-dashboard', 'the dashboard'],
    ['menu-eventLog', 'the event log'],
    ['menu-reports', 'reports'],
  ])('scrolls the app container back to the top when %s is clicked', (testId) => {
    const container = addScrollContainer(800);
    const { getByTestId } = renderSidebar();

    fireEvent.click(getByTestId(testId));

    expect(container.scrollTop).toBe(0);
  });

  it('links the reports menu item to the reports page', () => {
    const { getByTestId } = renderSidebar();

    expect(getByTestId('menu-reports')).toHaveAttribute('href', '/reports');
  });

  it('does not throw when the scroll container is absent', () => {
    const { getByTestId } = renderSidebar();

    expect(() => fireEvent.click(getByTestId('menu-task'))).not.toThrow();
  });
});
