import React from 'react';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteAddEditForm } from './edit';
import { FeedbackSite } from '@store/feedback/models';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import FeedbackSites from './sites';
import { debug } from 'console';
import { url } from 'inspector';

const mockStore = configureStore([]);
const sitesstore = mockStore({
  feedback: {
    sites: [{ url: 'http://newsite.com', allowAnonymous: true, views: [] }],
    isLoading: false,
  },
  session: {
    indicator: { show: false },
  },
});

describe('SiteAddEditForm', () => {
  afterEach(cleanup);
  const initialSite: FeedbackSite = { url: 'https://example.com', allowAnonymous: true, views: [] };
  const emptySite: FeedbackSite = { url: '', allowAnonymous: false, views: [] };
  const inValidSite: FeedbackSite = { url: 'xyz', allowAnonymous: false, views: [] };
  const onSaveMock = jest.fn();
  const onCloseMock = jest.fn();
  const sites: FeedbackSite[] = [{ url: 'https://test.com', allowAnonymous: false, views: [] }];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without errors', () => {
    render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={false}
      />
    );

    expect(screen.getByTestId('add-site-modal')).toBeInTheDocument();
  });
  it('save button should be disabled', () => {
    const { findByText, queryByTestId } = render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={false}
      />
    );
    const saveBtn = queryByTestId('site-save');
    expect(saveBtn).toBeDisabled();
  });

  it('populates form fields based on initial values', () => {
    render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={false}
      />
    );

    expect(screen.getByTestId('feedback-url')).toHaveValue('https://example.com');
  });

  it('validates form input - required fields', async () => {
    const { findByText, queryByTestId } = render(
      <Provider store={sitesstore}>
        <SiteAddEditForm
          initialValue={inValidSite}
          sites={sites}
          onClose={onCloseMock}
          onSave={onSaveMock}
          open={true}
          isEdit={false}
        />
      </Provider>
    );

    const urlInput = queryByTestId('feedback-url');
    fireEvent(urlInput, new CustomEvent('_change', { detail: { value: 'gggghj' } }));
    const urlFormItem = queryByTestId('feedback-url-formitem');
    expect(urlFormItem).toHaveAttribute('error', 'Please enter a valid URL');
  });
  it('No error should exists when valid url is provided', async () => {
    const { findByText, queryByTestId } = render(
      <Provider store={sitesstore}>
        <SiteAddEditForm
          initialValue={emptySite}
          sites={sites}
          onClose={onCloseMock}
          onSave={onSaveMock}
          open={true}
          isEdit={false}
        />
      </Provider>
    );

    const urlInput = queryByTestId('feedback-url');
    fireEvent(urlInput, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    const urlFormItem = queryByTestId('feedback-url-formitem');
    expect(urlFormItem).toHaveAttribute('error', '');
  });
  it('Save button should be enabled when valid url is provided', async () => {
    const { findByText, queryByTestId } = render(
      <Provider store={sitesstore}>
        <SiteAddEditForm
          initialValue={emptySite}
          sites={sites}
          onClose={onCloseMock}
          onSave={onSaveMock}
          open={true}
          isEdit={false}
        />
      </Provider>
    );

    const urlInput = queryByTestId('feedback-url');
    fireEvent(urlInput, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    const urlFormItem = queryByTestId('feedback-url-formitem');
    expect(urlFormItem).toHaveAttribute('error', '');
    const saveBtn = queryByTestId('site-save');
    expect(saveBtn).toHaveAttribute('disabled', 'false');
  });
  it('URL field should be disabled when editing site', () => {
    const { queryByTestId } = render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={true}
      />
    );
    const urlInput = queryByTestId('feedback-url');
    expect(urlInput).toBeDisabled();
  });
});
