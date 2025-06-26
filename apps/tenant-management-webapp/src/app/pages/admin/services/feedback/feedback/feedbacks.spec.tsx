import React from 'react';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbacksList } from './feedbacks';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { exportFeedbacks, getFeedbackSites, getFeedbacks } from '@store/feedback/actions';

jest.mock('@store/feedback/actions', () => ({
  getFeedbackSites: jest.fn(),
  getFeedbacks: jest.fn(),
  exportFeedbacks: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('Feedbacks Components', () => {
  let store;
  beforeEach(() => {
    store = mockStore({
      tenant: { name: 'autotest' },
      feedback: {
        sites: [
          {
            sites: [
              { url: 'http://newsite.com', allowAnonymous: true, views: [] },
              { url: 'http://testsite.com', allowAnonymous: true, views: [] },
            ],
            isLoading: false,
          },
        ],

        feedbacks: [
          {
            timestamp: '2024-05-17T15:35:40.762Z',
            correlationId: 'http://feedbacktestdata.com:/admin/services/feedback',
            context: {
              site: 'http://feedbacktestdata.com',
              view: '/admin/services/feedback',
              digest: '210dc8419c576e782a45f7484d95546ba8a7c0c17ae809744bcbce0f6a36b57f',
              includesComment: true,
            },
            value: {
              rating: 'delightful',
              comment: 'dev feedback test',
            },
          },
        ],
        isLoading: false,
        exportData: [],
      },
      session: {
        indicator: { show: false },
      },
      page: {
        next: 'MTA=',
        size: 10,
      },
      searchCriteria: {
        startDate: null,
        endDate: null,
        isExport: false,
      },
    });
    store.dispatch = jest.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    expect(baseElement.querySelector("goa-dropdown[testId='sites-dropdown']")).toBeInTheDocument();
  });

  it('should dispatch getFeedbackSites action on mount', () => {
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    expect(store.dispatch).toHaveBeenCalledWith(getFeedbackSites());
  });

  it('should dispatch getFeedbacks action when a site is selected', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(store.dispatch).toHaveBeenCalledWith(
      getFeedbacks({ url: 'http://newsite.com', allowAnonymous: true }, store.getState().searchCriteria)
    );
  });

  it('should show feedbacks list with toggle-details-visibility icon button', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(screen.getByTestId('feedback-list_0')).toBeInTheDocument();
    expect(baseElement.querySelector("goa-icon-button[testId='toggle-details-visibility_0']")).toBeInTheDocument();
  });

  it('should show details of feedback when toggle-details-visibility icon button is clicked', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='toggle-details-visibility_0']"),
      new CustomEvent('_click')
    );
    expect(screen.getByTestId('moredetails')).toBeInTheDocument();
  });

  it('should show no feedbacks found if no feedbacks', () => {
    store = mockStore({
      feedback: {
        sites: [
          {
            sites: [{ url: 'http://newsite.com', allowAnonymous: true, views: [] }],
            isLoading: false,
          },
        ],

        feedbacks: [],
        isLoading: false,
      },
      session: {
        indicator: { show: false },
      },
      page: {
        next: 'MTA=',
        size: 10,
      },
    });

    store.dispatch = jest.fn();
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(screen.getAllByText('No feedbacks found')).toBeTruthy();
  });

  it('should open full screen modal when "Expand View" button is clicked', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );

    const expandBtn = getByText('Expand View');
    fireEvent.click(expandBtn);

    await waitFor(() => {
      expect(screen.getByText('Feedback service')).toBeInTheDocument();
      expect(screen.getByText('Collapse view')).toBeInTheDocument();
    });
  });
});
