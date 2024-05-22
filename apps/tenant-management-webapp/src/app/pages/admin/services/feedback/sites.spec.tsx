import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import FeedbackSites from './sites';
import { defaultFeedbackSite } from '@store/feedback/models';

const mockStore = configureStore([]);
const store = mockStore({
  feedback: {
    sites: [{ url: 'http://newsite.com', allowAnonymous: true, views: [] }],
    isLoading: false,
  },
  session: {
    indicator: { show: false },
  },
});

describe('FeedbackSites Component', () => {
  it('renders without errors', () => {
    render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );
  });

  it('allows adding a new site', () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );
    fireEvent(getByTestId('add-site'), new CustomEvent('_click'));
    expect(getByTestId('add-site-modal')).toBeInTheDocument();
  });

  it('dispatches getFeedbackSites action on mount', () => {
    render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );
    expect(store.getActions()).toContainEqual({ type: 'feedback/FETCH_FEEDBACK_SITES_ACTION' });
  });

  it('calls updateFeedbackSite when saving a new site', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );

    fireEvent(getByTestId('add-site'), new CustomEvent('_click'));
    fireEvent.change(getByTestId('feedback-url'), { target: { value: 'http://newsite.com' } });
    fireEvent(getByTestId('site-register'), new CustomEvent('_click'));

    const newSiteURL = screen.getByText('http://newsite.com');
    expect(newSiteURL).toBeInTheDocument();
  });

  it('Close add/edit modal when cancel button is clicked', async () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );
    const addButton = getByTestId('add-site');
    fireEvent(addButton, new CustomEvent('_click'));
    const modal = getByTestId('add-site-modal');
    expect(modal).toBeInTheDocument();
    expect(getByTestId('site-cancel')).toBeInTheDocument();
    const cancelButton = getByTestId('site-cancel');
    fireEvent(cancelButton, new CustomEvent('_click'));
    expect(screen.queryByTestId('add-site-modal')).not.toBeInTheDocument();
  });
});
