import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import FeedbackSites from './sites';

const mockStore = configureStore([]);
const store = mockStore({
  feedback: {
    sites: [{ url: 'http://newsite.com', allowAnonymous: true, views: [] }],
    isLoading: false,
  },
  session: {
    indicator: { show: false },
  },
  form: {
    formResourceTag: {
      tags: [{ url: 'https://www.somewhere.com', label: 'atag', value: 'atag', _links: {} }],
    },
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
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );
    fireEvent(baseElement.querySelector("goa-button[testId='add-site']"), new CustomEvent('_click'));
    expect(baseElement.querySelector("goa-modal[testId='add-site-modal']")).toBeInTheDocument();
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
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );

    fireEvent(baseElement.querySelector("goa-button[testId='add-site']"), new CustomEvent('_click'));

    const url = baseElement.querySelector("goa-input[testId='feedback-url']");

    fireEvent(
      url,
      new CustomEvent('_change', {
        detail: { value: 'http://newsite.com' },
      })
    );
    fireEvent(baseElement.querySelector("goa-button[testId='site-register']"), new CustomEvent('_click'));

    const newSiteURL = screen.getByText('http://newsite.com');
    expect(newSiteURL).toBeInTheDocument();
  });

  it('Close add/edit modal when cancel button is clicked', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbackSites />
      </Provider>
    );
    const addButton = baseElement.querySelector("goa-button[testId='add-site']");
    fireEvent(addButton, new CustomEvent('_click'));
    const modal = baseElement.querySelector("goa-modal[testId='add-site-modal']");
    expect(modal).toBeInTheDocument();
    expect(baseElement.querySelector("goa-button[testId='site-cancel']")).toBeInTheDocument();
    const cancelButton = baseElement.querySelector("goa-button[testId='site-cancel']");
    fireEvent(cancelButton, new CustomEvent('_click'));
    expect(baseElement.querySelector("goa-modal[testId='add-site-modal']")).not.toBeInTheDocument();
  });
});
