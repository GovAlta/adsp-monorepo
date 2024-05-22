import React from 'react';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbacksList } from './feedbacks';
import { FeedbackSite, Feedback } from '@store/feedback/models';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { getFeedbackSites, getFeedbacks } from '@store/feedback/actions';

jest.mock('@store/feedback/actions', () => ({
  getFeedbackSites: jest.fn(),
  getFeedbacks: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('Feedbacks Components ', () => {
  let store;
  beforeEach(() => {
    store = mockStore({
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
  });
  it('should renders correctly', () => {
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    expect(screen.getByTestId('sites-dropdown')).toBeInTheDocument();
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
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = screen.getByTestId('sites-dropdown');
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(store.dispatch).toHaveBeenCalledWith(
      getFeedbacks({ url: 'http://newsite.com', allowAnonymous: true, views: [] })
    );
  });

  it('should show feedbacks list with toggle-details-visibility icon button', () => {
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = screen.getByTestId('sites-dropdown');
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(screen.getByTestId('feedback-list-correlation-id')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-details-visibility')).toBeInTheDocument();
  });
  it('should show details of feedback when toggle-details-visibility icon button is clicked', () => {
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = screen.getByTestId('sites-dropdown');
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    fireEvent(screen.getByTestId('toggle-details-visibility'), new CustomEvent('_click'));
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
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>
    );
    const dropDown = screen.getByTestId('sites-dropdown');
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(screen.getByText('No feedbacks found')).toBeInTheDocument();
  });
});
