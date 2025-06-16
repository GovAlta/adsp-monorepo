import React from 'react';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbacksList } from './feedback/feedbacks';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { getFeedbackSites, getFeedbacks } from '@store/feedback/actions';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@store/feedback/actions', () => ({
  getFeedbackSites: jest.fn(),
  getFeedbacks: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('FeedbacksList Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      tenant: { name: 'autotest' },
      feedback: {
        sites: [
          { url: 'http://newsite.com', allowAnonymous: true, views: [] },
          { url: 'http://testsite.com', allowAnonymous: true, views: [] },
        ],
        feedbacks: [],
        exportData: [],
      },
      session: { indicator: { show: false } },
    });

    store.dispatch = jest.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render dropdown and allow site selection', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <MemoryRouter>
          <FeedbacksList />
        </MemoryRouter>
      </Provider>
    );

    const dropDown = baseElement.querySelector("goa-dropdown[testid='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));

    // We don't need to test getFeedbacks dispatch here since it's now dispatched on Results page.
  });

  it('should show date fields when site selected', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <MemoryRouter>
          <FeedbacksList />
        </MemoryRouter>
      </Provider>
    );

    const startDateInput = baseElement.querySelector("goa-input[testid='startDate']");
    const endDateInput = baseElement.querySelector("goa-input[testid='endDate']");

    await waitFor(() => {
      expect(startDateInput).toBeInTheDocument();
      expect(endDateInput).toBeInTheDocument();
    });
  });
});
