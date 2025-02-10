import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteAddEditForm } from './edit';
import { FeedbackSite } from '@store/feedback/models';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

const mockStore = configureStore([]);
const sitesStore = mockStore({
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
  const initialSite: FeedbackSite = { url: 'https://example.com', allowAnonymous: true };
  const emptySite: FeedbackSite = { url: '', allowAnonymous: false };
  const inValidSite: FeedbackSite = { url: 'xyz', allowAnonymous: false };
  const onSaveMock = jest.fn();
  const onCloseMock = jest.fn();
  const sites: FeedbackSite[] = [{ url: 'https://test.com', allowAnonymous: false }];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without errors', () => {
    const { baseElement } = render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={false}
      />
    );

    expect(baseElement.querySelector("goa-modal[testId='add-site-modal']")).toBeInTheDocument();
  });
  it('save button should be disabled', () => {
    const { baseElement } = render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={false}
      />
    );
    const saveBtn = baseElement.querySelector("goa-button[testId='site-register']");
    expect(saveBtn).toBeDisabled();
  });

  it('populates form fields based on initial values', () => {
    const { baseElement } = render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={true}
      />
    );
    const urlInput = baseElement.querySelector("goa-input[testId='feedback-url']");
    expect(urlInput).not.toBeNull();
  });

  it('validates form input - required fields', async () => {
    const { baseElement } = render(
      <Provider store={sitesStore}>
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

    const urlInput = baseElement.querySelector("goa-input[testId='feedback-url']");
    fireEvent(urlInput, new CustomEvent('_change', { detail: { value: 'gggghj' } }));
    const urlFormItem = baseElement.querySelector("goa-form-item[testId='feedback-url-formItem']");
    expect(urlFormItem).toHaveAttribute('error', 'Please enter a valid URL');
  });
  it('No error should exists when valid url is provided', async () => {
    const { findByText, queryByTestId, baseElement } = render(
      <Provider store={sitesStore}>
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

    const urlInput = baseElement.querySelector("goa-input[testId='feedback-url']");
    fireEvent(urlInput, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    const urlFormItem = baseElement.querySelector("goa-form-item[testId='feedback-url-formItem']");
    expect(urlFormItem).toHaveAttribute('error', '');
  });
  it('Save button should be enabled when valid url is provided', async () => {
    const { baseElement } = render(
      <Provider store={sitesStore}>
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

    const urlInput = baseElement.querySelector("goa-input[testId='feedback-url']");
    fireEvent(urlInput, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    const urlFormItem = baseElement.querySelector("goa-form-item[testId='feedback-url-formItem']");
    expect(urlFormItem).toHaveAttribute('error', '');
    const saveBtn = baseElement.querySelector("goa-button[testId='site-register']");
    expect(saveBtn).toHaveAttribute('disabled', 'false');
  });
  it('URL field should be disabled when editing site', () => {
    const { baseElement } = render(
      <SiteAddEditForm
        initialValue={initialSite}
        sites={sites}
        onClose={onCloseMock}
        onSave={onSaveMock}
        open={true}
        isEdit={true}
      />
    );
    const urlInput = baseElement.querySelector("goa-input[testId='feedback-url']");
    expect(urlInput).toBeDisabled();
  });
});
