import React from 'react';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbacksList } from './feedbacks';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { getFeedbackSites, getFeedbacks } from '@store/feedback/actions';

jest.mock('@store/feedback/actions', () => ({
  getFeedbackSites: jest.fn(),
  getFeedbacks: jest.fn(),
  exportFeedbacks: jest.fn(),
  getFeedbackSummary: jest.fn(),
  clearFeedbackSummary: jest.fn(),
}));

const mockStore = configureStore([thunk]);
const newSite = { url: 'http://newsite.com', allowAnonymous: true, views: [] };
const getFeedbacksMock = getFeedbacks as jest.Mock;

const selectSite = (baseElement: HTMLElement, url = newSite.url) =>
  fireEvent(
    baseElement.querySelector("goa-dropdown[testId='sites-dropdown']"),
    new CustomEvent('_change', { detail: { value: url } }),
  );

describe('Feedbacks Components', () => {
  let store;
  beforeEach(() => {
    store = mockStore({
      tenant: { name: 'autotest' },
      feedback: {
        sites: [newSite, { url: 'http://testsite.com', allowAnonymous: true, views: [] }],
        page: { page: 1, pageSize: 20, total: 60 },

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
          {
            timestamp: '2024-05-17T15:35:40.762Z',
            correlationId: 'http://newsite.com:/admin/services/feedback',
            context: {
              site: 'http://newsite.com',
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
        summary: {
          totalResponses: 247,
          averageRating: 3.8,
          responsesWithComments: 38,
          responsesWithIssues: 21,
        },
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
      </Provider>,
    );
    expect(baseElement.querySelector("goa-dropdown[testId='sites-dropdown']")).toBeInTheDocument();
  });

  it('should dispatch getFeedbackSites action on mount', () => {
    render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    expect(store.dispatch).toHaveBeenCalledWith(getFeedbackSites());
  });

  it('should dispatch getFeedbacks action when a site is selected', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    selectSite(baseElement);
    expect(getFeedbacksMock).toHaveBeenLastCalledWith(newSite, expect.any(Object), 1, 20, true);
  });

  describe('pagination', () => {
    beforeEach(() => {
      getFeedbacksMock.mockClear();
    });

    it('does not offer load more', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);

      expect(screen.queryByText('Load more')).not.toBeInTheDocument();
    });

    it('shows the pagination and the total number of matching responses', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);

      expect(screen.getByTestId('feedback-result-count')).toHaveTextContent('Showing 1–2 of 60 responses');
      expect(screen.getByTestId('feedback-pagination')).toBeInTheDocument();
    });

    it('loads the selected page with the current criteria and page size, without recounting', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);

      fireEvent.change(screen.getByTestId('feedback-pagination-page'), { target: { value: '3' } });

      expect(getFeedbacksMock).toHaveBeenLastCalledWith(newSite, expect.any(Object), 3, 20);
    });

    it('returns to page 1 at the new size when the page size changes', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);

      fireEvent(
        baseElement.querySelector('goa-dropdown[name="feedback-page-size"]'),
        new CustomEvent('_change', { detail: { name: 'feedback-page-size', value: '50' } }),
      );

      expect(getFeedbacksMock).toHaveBeenLastCalledWith(newSite, expect.any(Object), 1, 50, true);
    });

    it('keeps the selected page size when paging', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);
      fireEvent(
        baseElement.querySelector('goa-dropdown[name="feedback-page-size"]'),
        new CustomEvent('_change', { detail: { name: 'feedback-page-size', value: '10' } }),
      );

      fireEvent.change(screen.getByTestId('feedback-pagination-page'), { target: { value: '2' } });

      expect(getFeedbacksMock).toHaveBeenLastCalledWith(newSite, expect.any(Object), 2, 10);
    });

    it('returns to page 1 with a fresh total when the date range changes', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);
      fireEvent.change(screen.getByTestId('feedback-pagination-page'), { target: { value: '3' } });

      fireEvent(
        baseElement.querySelector("goa-input[name='feedback-filter-start-date']"),
        new CustomEvent('_change', { detail: { value: '2024-01-01' } }),
      );

      expect(getFeedbacksMock).toHaveBeenLastCalledWith(
        newSite,
        expect.objectContaining({ startDate: new Date('2024-01-01').toISOString() }),
        1,
        20,
        true,
      );
    });

    it('returns to page 1 with a fresh total when the registered site changes', () => {
      const { baseElement } = render(
        <Provider store={store}>
          <FeedbacksList />
        </Provider>,
      );
      selectSite(baseElement);
      fireEvent.change(screen.getByTestId('feedback-pagination-page'), { target: { value: '3' } });

      selectSite(baseElement, 'http://testsite.com');

      expect(getFeedbacksMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ url: 'http://testsite.com' }),
        expect.any(Object),
        1,
        20,
        true,
      );
    });
  });

  it('should show feedbacks list with toggle-details-visibility icon button', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(screen.getByTestId('feedback-list_0')).toBeInTheDocument();
    expect(baseElement.querySelector("goa-icon-button[testId='toggle-details-visibility_0']")).toBeInTheDocument();
  });

  it('shows the summary immediately above the feedback table', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    selectSite(baseElement);

    const summary = screen.getByTestId('feedback-summary');
    const table = screen.getByTestId('feedback-table');
    expect(summary.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows only the summary skeleton while feedback is loading', () => {
    store = mockStore({
      tenant: { name: 'autotest' },
      feedback: {
        sites: [newSite],
        feedbacks: [],
        exportData: [],
        page: null,
        summary: null,
      },
      session: { indicator: { show: true } },
    });
    store.dispatch = jest.fn();
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );

    selectSite(baseElement);

    expect(screen.getByTestId('feedback-summary-loading')).toBeInTheDocument();
    expect(baseElement.querySelector('goa-circular-progress')).not.toBeInTheDocument();
  });

  it('should show details of feedback when toggle-details-visibility icon button is clicked', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='toggle-details-visibility_0']"),
      new CustomEvent('_click'),
    );
    expect(screen.getByTestId('moredetails')).toBeInTheDocument();
  });

  it('should show no feedbacks found if no feedbacks', () => {
    store = mockStore({
      feedback: {
        sites: [newSite],
        page: { page: 1, pageSize: 20, total: 0 },

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
      </Provider>,
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));
    expect(screen.getAllByText('No feedbacks found')).toBeTruthy();
    expect(baseElement.querySelector("goa-button[testId='expand-feedback-view']")).toBeDisabled();
    expect(screen.queryByTestId('feedback-pagination')).not.toBeInTheDocument();
  });

  it('should open full screen when "Expand View" button is clicked', async () => {
    store = mockStore({
      feedback: {
        sites: [{ url: 'http://newsite.com', allowAnonymous: true, views: [] }],
        feedbacks: [
          {
            timestamp: Date.now(),
            context: { site: 'http://newsite.com', view: 'main', correlationId: 'abc' },
            value: { rating: 'Easy', ratingValue: 4, comment: 'Great!', technicalIssue: '' },
          },
        ],
        exportData: [],
        page: null,
        isLoading: false,
      },
      session: { indicator: { show: false } },
      tenant: { name: 'test-tenant' },
    });

    store.dispatch = jest.fn();
    const { getByText, baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));

    const expandBtn = getByText('Expand view');

    fireEvent(expandBtn, new CustomEvent('_click'));
    await waitFor(() => {
      expect(screen.getByText('Collapse view')).toBeInTheDocument();
      expect(screen.getByText('Feedback service')).toBeInTheDocument();
    });
  });

  it('should show the date range error when the start date is after the end date', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));

    const startDate = baseElement.querySelector("goa-input[name='feedback-filter-start-date']");
    fireEvent(startDate, new CustomEvent('_change', { detail: { value: '2099-12-31' } }));

    expect(screen.getByText('Start date must be before End date.')).toBeInTheDocument();
  });

  it('should keep the error icon and message on the same horizontal level', () => {
    // Regression guard: the badge and the message used to be bare siblings in a plain div, so they
    // were baseline-aligned in an inline formatting context and the message compensated with
    // line-height: 2.5rem and top: -3px. That left the icon and text on different levels.
    const { baseElement } = render(
      <Provider store={store}>
        <FeedbacksList />
      </Provider>,
    );
    const dropDown = baseElement.querySelector("goa-dropdown[testId='sites-dropdown']");
    fireEvent(dropDown, new CustomEvent('_change', { detail: { value: 'http://newsite.com' } }));

    const startDate = baseElement.querySelector("goa-input[name='feedback-filter-start-date']");
    fireEvent(startDate, new CustomEvent('_change', { detail: { value: '2099-12-31' } }));

    const wrapper = screen.getByText('Start date must be before End date.').parentElement;
    const styles = getComputedStyle(wrapper);
    expect(styles.display).toBe('flex');
    expect(styles.alignItems).toBe('center');
  });
});
