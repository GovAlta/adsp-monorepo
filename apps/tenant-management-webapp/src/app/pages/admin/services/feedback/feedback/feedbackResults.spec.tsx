import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackResults } from './feedbackResults';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { getFeedbacks, exportFeedbacks } from '@store/feedback/actions';

jest.mock('@store/feedback/actions', () => ({
  getFeedbacks: jest.fn(),
  exportFeedbacks: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('FeedbackResults Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      tenant: { name: 'autotest' },
      feedback: {
        sites: [
          { url: 'http://newsite.com', allowAnonymous: true, views: [] },
          { url: 'http://testsite.com', allowAnonymous: true, views: [] },
        ],
        feedbacks: [
          {
            timestamp: '2024-05-17T15:35:40.762Z',
            correlationId: 'cid123',
            context: {
              site: 'http://newsite.com',
              view: '/admin/services/feedback',
            },
            value: {
              rating: 'delightful',
              comment: 'Test feedback',
              technicalIssue: '',
            },
          },
        ],
        exportData: [],
      },
      session: {
        indicator: { show: false },
      },
    });

    store.dispatch = jest.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (
    route = '/admin/services/feedback/results?site=http://newsite.com&start=2024-01-01&end=2024-01-31'
  ) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <FeedbackResults />
        </MemoryRouter>
      </Provider>
    );
  };

  it('should render Feedback Results page correctly', () => {
    renderComponent();
    expect(screen.getByText('Feedback Results')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('should dispatch getFeedbacks action on mount', () => {
    renderComponent();

    expect(getFeedbacks).toHaveBeenCalledWith(
      { url: 'http://newsite.com', allowAnonymous: true, views: [] },
      { startDate: '2024-01-01', endDate: '2024-01-31' }
    );
  });

  it('should show "No feedback data found" if no feedbacks present', () => {
    store = mockStore({
      tenant: { name: 'autotest' },
      feedback: {
        sites: [{ url: 'http://newsite.com', allowAnonymous: true, views: [] }],
        feedbacks: [],
        exportData: [],
      },
      session: { indicator: { show: false } },
    });

    store.dispatch = jest.fn();
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={['/admin/services/feedback/results?site=http://newsite.com&start=2024-01-01&end=2024-01-31']}
        >
          <FeedbackResults />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('No feedback data found for selected range.')).toBeInTheDocument();
  });

  it('should dispatch exportFeedbacks when export button clicked', async () => {
    renderComponent();

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        exportFeedbacks({ site: 'http://newsite.com' }, { startDate: '2024-01-01', endDate: '2024-01-31' })
      );
    });
  });

  it('should navigate back on Back button click', () => {
    renderComponent();

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    expect(backButton).toBeInTheDocument();
  });
});
