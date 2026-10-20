import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventSearchForm } from './eventSearchForm';
import { GoabButton } from '@abgov/react-components';
import {
  DATE_RANGE_OPTIONS,
  dateRangeCriteria,
  defaultEventLogCriteria,
  getDateRangeLabel,
  toDateTimeLocalValue,
} from './util';

describe('EventSearchForm', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-19T18:30:45.123Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockStore = configureStore([]);
  const createStore = () =>
    mockStore({
      event: {
        definitions: {
          'form-service:form-created': {
            namespace: 'form-service',
            name: 'form-created',
          },
          'form-service:form-submitted': {
            namespace: 'form-service',
            name: 'form-submitted',
          },
          'script-service:script-executed': {
            namespace: 'script-service',
            name: 'script-executed',
          },
        },
      },
    });

  const renderComponent = (props: React.ComponentProps<typeof EventSearchForm> = {}) =>
    render(
      <Provider store={createStore()}>
        <EventSearchForm {...props} />
      </Provider>,
    );
  const clickGoaButton = (button: Element | null) => {
    fireEvent(button as Element, new CustomEvent('_click'));
  };
  const changeGoaDropdown = (dropdown: Element | null, value: string) => {
    fireEvent(dropdown as Element, new CustomEvent('_change', { detail: { value } }));
  };
  const changeGoaInput = (input: Element | null, value: string) => {
    fireEvent(input as Element, new CustomEvent('_change', { detail: { value } }));
  };

  it.each(['event-log-date-range-filter', 'event-log-namespace-filter', 'event-log-name-filter'])(
    'uses the native dropdown for %s to avoid nested interactive controls',
    (name) => {
      const { container } = renderComponent();

      expect(container.querySelector(`goa-dropdown[name="${name}"]`)).toHaveAttribute('native', 'true');
    },
  );

  it.each([
    'goa-dropdown[name="event-log-date-range-filter"]',
    'goa-dropdown[name="event-log-namespace-filter"]',
    'goa-dropdown[name="event-log-name-filter"]',
    'goa-input[name="event-log-correlation-filter"]',
    'goa-button[testid="event-log-filter-search"]',
    'goa-button[testid="event-log-filter-reset"]',
  ])('disables %s during loading and re-enables it afterward', (selector) => {
    const store = createStore();
    const { container, rerender } = render(
      <Provider store={store}>
        <EventSearchForm disabled />
      </Provider>,
    );

    expect(container.querySelector(selector)).toHaveAttribute('disabled');

    rerender(
      <Provider store={store}>
        <EventSearchForm disabled={false} />
      </Provider>,
    );

    expect(container.querySelector(selector)).not.toHaveAttribute('disabled');
  });

  it('shows only the Filters button in the top filter controls', () => {
    const { container } = renderComponent();

    const buttons = Array.from(container.querySelectorAll('goa-button-group goa-button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(buttons).toEqual(['Filters']);
  });

  it('places Filters immediately after the left action', () => {
    const { container } = renderComponent({
      leftAction: (
        <GoabButton size="compact" type="tertiary" testId="export-event-log-csv">
          Download CSV
        </GoabButton>
      ),
    });

    const buttons = Array.from(
      container.querySelectorAll('goa-button[testid="export-event-log-csv"], goa-button-group goa-button'),
    ).map((button) => button.textContent?.trim());

    expect(buttons).toEqual(['Download CSV', 'Filters']);
    expect(container.querySelector('goa-button[testid="event-log-filters-toggle"]')).toHaveAttribute('size', 'compact');
  });

  it('does not show top-level Search or Reset buttons', () => {
    const { container } = renderComponent();

    expect(container.querySelector('goa-button[testid="event-log-search"]')).not.toBeInTheDocument();
    expect(container.querySelector('goa-button[testid="event-log-reset"]')).not.toBeInTheDocument();
  });

  it('keeps the additional filter panel collapsed by default and allows toggling during loading without searching', () => {
    const onSearch = jest.fn();
    const { container, queryByLabelText } = renderComponent({ onSearch, disabled: true });

    expect(container.querySelector('goa-button[testid="event-log-filters-toggle"]')).not.toHaveAttribute('disabled');

    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).not.toHaveAttribute('open');
    expect(container.querySelector('goa-button[testid="event-log-filters-toggle"]')).toHaveAttribute(
      'trailingicon',
      'chevron-forward',
    );
    expect(queryByLabelText('Search')).not.toBeInTheDocument();
    expect(queryByLabelText('timestampMin')).not.toBeInTheDocument();
    expect(queryByLabelText('timestampMax')).not.toBeInTheDocument();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).toHaveAttribute('open');
    expect(container.querySelector('goa-button[testid="event-log-filters-toggle"]')).toHaveAttribute(
      'trailingicon',
      'chevron-back',
    );
    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).toHaveAttribute('maxsize', '480px');
    expect(container.querySelector('goa-button[testid="event-log-filter-reset"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-button[testid="event-log-filter-close"]')).toBeInTheDocument();
    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toBeInTheDocument();
    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toHaveAttribute('size', 'compact');
    expect(container.querySelector('goa-button[testid="event-log-filter-reset"]')).toHaveAttribute('size', 'compact');
    expect(container.querySelector('goa-button[testid="event-log-filter-reset"]')).toHaveAttribute('type', 'secondary');
    expect(container.querySelector('goa-button[testid="event-log-filter-close"]')).toHaveAttribute('size', 'compact');
    expect(container.querySelector('goa-button[testid="event-log-filter-close"]')).toHaveAttribute('type', 'secondary');
    expect(container.querySelector('[data-testid="event-log-filter-actions"]')).toContainElement(
      container.querySelector('goa-button[testid="event-log-filter-reset"]'),
    );
    expect(container.querySelector('[data-testid="event-log-filter-actions"]')).toContainElement(
      container.querySelector('goa-button[testid="event-log-filter-close"]'),
    );
    expect(container.querySelector('[data-testid="event-log-filter-actions"]')).toContainElement(
      container.querySelector('goa-button[testid="event-log-filter-search"]'),
    );
    expect(container.querySelector('[data-testid="event-log-filter-actions"]')?.parentElement).toHaveAttribute(
      'slot',
      'actions',
    );
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toHaveAttribute(
      'size',
      'compact',
    );
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toHaveAttribute(
      'size',
      'compact',
    );
    expect(queryByLabelText('Search')).not.toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).not.toHaveAttribute('open');
    expect(container.querySelector('goa-button[testid="event-log-filters-toggle"]')).toHaveAttribute(
      'trailingicon',
      'chevron-forward',
    );
    expect(queryByLabelText('Search')).not.toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('closes the filter panel without changing filters or searching', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-123');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-close"]'));

    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).not.toHaveAttribute('open');
    expect(onSearch).not.toHaveBeenCalled();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'script-service',
    );
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toHaveAttribute(
      'value',
      'corr-123',
    );
  });

  it('keeps panel filter values when the additional filter panel is toggled', () => {
    const { container, queryByLabelText } = renderComponent();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-123');
    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));

    expect(queryByLabelText('Search')).not.toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'script-service',
    );
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toHaveAttribute(
      'value',
      'script-executed',
    );
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toHaveAttribute(
      'value',
      'corr-123',
    );
  });

  it('shows all namespaces and filters event names by selected namespace', () => {
    const { container } = renderComponent();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));

    expect(container.querySelector('goa-dropdown-item[value="all-namespaces"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="form-service"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="script-service"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="form-created"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="script-executed"]')).toBeInTheDocument();

    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');

    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'script-service',
    );
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toHaveAttribute(
      'value',
      'all-event-names',
    );
    expect(container.querySelector('goa-dropdown-item[value="script-executed"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="form-created"]')).not.toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="form-submitted"]')).not.toBeInTheDocument();

    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'all-namespaces');

    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'all-namespaces',
    );
    expect(container.querySelector('goa-dropdown-item[value="form-created"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="form-submitted"]')).toBeInTheDocument();
  });

  it('clears the event name selection when namespace changes', () => {
    const { container } = renderComponent();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'form-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'form-created');

    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toHaveAttribute(
      'value',
      'form-created',
    );

    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');

    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'script-service',
    );
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toHaveAttribute(
      'value',
      'all-event-names',
    );
    expect(container.querySelector('goa-dropdown-item[value="script-executed"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown-item[value="form-created"]')).not.toBeInTheDocument();
  });

  it('submits additional panel filters as search criteria', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'today');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-456');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'script-service',
        name: 'script-executed',
        correlationId: 'corr-456',
        timestampMin: dateRangeCriteria('today').timestampMin,
        timestampMax: dateRangeCriteria('today').timestampMax,
      }),
    );
  });

  it('submits drawer filters from the filter panel search button', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'today');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-999');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'script-service',
        name: 'script-executed',
        correlationId: 'corr-999',
        timestampMin: dateRangeCriteria('today').timestampMin,
        timestampMax: dateRangeCriteria('today').timestampMax,
      }),
    );
  });

  it('keeps the search input hidden when an event name filter is selected', () => {
    const onSearch = jest.fn();
    const { container, queryByLabelText } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');

    expect(queryByLabelText('Search')).not.toBeInTheDocument();
    expect(container.querySelector('.suggestions')).not.toBeInTheDocument();

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'script-service',
        name: 'script-executed',
      }),
    );
  });

  it('resets the filter panel and searches Last 7 days', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-789');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-reset"]'));

    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'all-namespaces',
    );
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toHaveAttribute(
      'value',
      'all-event-names',
    );
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toHaveAttribute('value', '');
    expect(onSearch).toHaveBeenCalledWith(defaultEventLogCriteria());

    fireEvent(
      container.querySelector('goa-drawer[testid="event-log-filter-panel"]') as Element,
      new CustomEvent('_close'),
    );
    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).not.toHaveAttribute('open');
  });

  it('shows only Last 7 days until edited filters are applied, and keeps badges outside the closed drawer', () => {
    const { container, getByRole } = renderComponent();
    const badges = getByRole('group', { name: 'Active event log filters' });

    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');

    expect(badges.querySelectorAll('goa-filter-chip')).toHaveLength(1);
    expect(badges.querySelector('goa-filter-chip')).toHaveAttribute('content', 'Date range: Last 7 days');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

    expect(badges.querySelectorAll('goa-filter-chip')).toHaveLength(2);
    expect(badges.querySelector('[testid="event-log-filter-badge-namespace"]')).toHaveAttribute(
      'content',
      'Namespace: script-service',
    );
    expect(container.querySelector('goa-drawer')).not.toContainElement(badges);
    expect(container.querySelector('goa-drawer')).not.toHaveAttribute('open');
  });

  it.each([
    ['namespace', 'goa-dropdown[name="event-log-namespace-filter"]', 'all-namespaces'],
    ['name', 'goa-dropdown[name="event-log-name-filter"]', 'all-event-names'],
    ['correlationId', 'goa-input[name="event-log-correlation-filter"]', ''],
  ])('removes only the applied %s filter and searches without submitting draft edits', (key, selector, value) => {
    const onSearch = jest.fn();
    const applied = {
      ...defaultEventLogCriteria(),
      namespace: 'script-service',
      name: 'script-executed',
      correlationId: 'corr-applied',
    };
    const { container } = renderComponent({ initialValue: applied, onSearch });
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-unsaved');

    clickGoaButton(container.querySelector(`goa-filter-chip[testid="event-log-filter-badge-${key}"]`));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith({ ...applied, [key]: '' });
    expect(container.querySelector(selector)).toHaveAttribute('value', value);
    expect(container.querySelector(`goa-filter-chip[testid="event-log-filter-badge-${key}"]`)).not.toBeInTheDocument();
  });

  it('removes the date constraint and retains other applied filters', () => {
    const onSearch = jest.fn();
    const applied = { ...defaultEventLogCriteria(), namespace: 'script-service' };
    const { container } = renderComponent({ initialValue: applied, onSearch });

    clickGoaButton(container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]'));

    expect(onSearch).toHaveBeenCalledWith({ ...applied, timestampMin: '', timestampMax: '' });
    expect(
      container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]'),
    ).not.toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toHaveAttribute('value', '');
    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).not.toHaveAttribute('disabled');
  });

  it('removes the last date chip and disables Search until criteria are entered', () => {
    const { container } = renderComponent();

    clickGoaButton(container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]'));

    expect(container.querySelectorAll('goa-filter-chip')).toHaveLength(0);
    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toHaveAttribute('disabled');
  });

  it('restores Last 7 days after the date constraint has been removed', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });
    clickGoaButton(container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]'));

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-reset"]'));

    expect(onSearch).toHaveBeenLastCalledWith(defaultEventLogCriteria());
    expect(container.querySelector('goa-filter-chip')).toHaveAttribute('content', 'Date range: Last 7 days');
  });

  it('shows the applied custom date boundaries in the date badge', () => {
    const initialValue = { timestampMin: '2026-01-01T10:00', timestampMax: '2026-01-02T12:00' };
    const { container } = renderComponent({ initialValue });

    expect(container.querySelector('goa-filter-chip')).toHaveAttribute(
      'content',
      `Date range: ${getDateRangeLabel(initialValue)}`,
    );
  });

  it('resets applied badges to Last 7 days', () => {
    const { container } = renderComponent({
      initialValue: { ...defaultEventLogCriteria(), correlationId: 'corr-applied' },
    });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-reset"]'));

    expect(container.querySelectorAll('goa-filter-chip')).toHaveLength(1);
    expect(container.querySelector('goa-filter-chip')).toHaveAttribute('content', 'Date range: Last 7 days');
  });

  it('synchronizes controls and badges when a search is applied outside the drawer', () => {
    const store = createStore();
    const { container, rerender } = render(
      <Provider store={store}>
        <EventSearchForm initialValue={defaultEventLogCriteria()} />
      </Provider>,
    );
    const relatedSearch = { ...defaultEventLogCriteria(), correlationId: 'corr-related' };

    rerender(
      <Provider store={store}>
        <EventSearchForm initialValue={relatedSearch} />
      </Provider>,
    );

    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toHaveAttribute(
      'value',
      'corr-related',
    );
    expect(container.querySelector('goa-filter-chip[testid="event-log-filter-badge-correlationId"]')).toHaveAttribute(
      'content',
      'Correlation ID: corr-related',
    );
  });

  it('does not remove filters while a search is loading', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ disabled: true, onSearch });

    clickGoaButton(container.querySelector('goa-filter-chip'));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it.each(['', '2026-01-01T12:00', '2026-01-02T12:00'])(
    'prevents searches with a missing or reversed custom end date: %s',
    (end) => {
      const { container } = renderComponent();
      changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'custom');
      changeGoaInput(container.querySelector('goa-input[name="event-log-from-filter"]'), '2026-01-02T12:00');

      changeGoaInput(container.querySelector('goa-input[name="event-log-to-filter"]'), end);

      expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toHaveAttribute('disabled');
    },
  );

  it('offers every required period in order', () => {
    const { container } = renderComponent();

    const options = Array.from(
      container.querySelectorAll('goa-dropdown[name="event-log-date-range-filter"] goa-dropdown-item'),
    );

    expect(options.map((option) => option.getAttribute('label'))).toEqual([
      'Last hour',
      'Today',
      'Last 24 hours',
      'Last 7 days',
      'Last 30 days',
      'Custom',
    ]);
  });

  it.each(DATE_RANGE_OPTIONS.filter(({ value }) => value !== 'custom'))(
    'waits for Search before applying $label and resolves the period at search time',
    ({ value }) => {
      const onSearch = jest.fn();
      const { container } = renderComponent({ onSearch });
      changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), value);
      expect(onSearch).not.toHaveBeenCalled();
      jest.setSystemTime(new Date('2026-10-19T19:00:00.000Z'));

      clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

      expect(onSearch).toHaveBeenCalledWith(dateRangeCriteria(value as Exclude<typeof value, 'custom'>));
      expect(container.querySelector('goa-input[name="event-log-to-filter"]')).toHaveAttribute(
        'value',
        '2026-10-19T13:00',
      );
    },
  );

  it('shows disabled Mountain Time boundaries for the default Last 7 days', () => {
    const { container } = renderComponent();

    const from = container.querySelector('goa-input[name="event-log-from-filter"]');
    const to = container.querySelector('goa-input[name="event-log-to-filter"]');

    expect(from).toHaveAttribute('value', '2026-10-12T12:30');
    expect(to).toHaveAttribute('value', '2026-10-19T12:30');
    expect(from).toHaveAttribute('disabled');
    expect(to).toHaveAttribute('disabled');
  });

  it.each([
    ['today', '2026-10-19T00:00'],
    ['last-hour', '2026-10-19T11:30'],
    ['last-24-hours', '2026-10-18T12:30'],
    ['last-7-days', '2026-10-12T12:30'],
    ['last-30-days', '2026-09-19T12:30'],
  ])('shows the calculated disabled boundaries when %s is selected', (preset, start) => {
    const { container } = renderComponent();

    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), preset);

    const from = container.querySelector('goa-input[name="event-log-from-filter"]');
    const to = container.querySelector('goa-input[name="event-log-to-filter"]');
    expect(from).toHaveAttribute('value', start);
    expect(to).toHaveAttribute('value', '2026-10-19T12:30');
    expect(from).toHaveAttribute('disabled');
    expect(to).toHaveAttribute('disabled');
  });

  it.each(['today', 'last-hour', 'last-24-hours', 'last-7-days', 'last-30-days'] as const)(
    'initializes Custom with the current %s period in Mountain Time',
    (preset) => {
      const onSearch = jest.fn();
      const { container } = renderComponent({ onSearch });
      changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), preset);
      const expected = dateRangeCriteria(preset);

      changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'custom');

      expect(container.querySelector('goa-input[name="event-log-from-filter"]')).toHaveAttribute(
        'value',
        toDateTimeLocalValue(new Date(expected.timestampMin)),
      );
      expect(container.querySelector('goa-input[name="event-log-to-filter"]')).toHaveAttribute(
        'value',
        toDateTimeLocalValue(new Date(expected.timestampMax)),
      );
      expect(container.querySelector('goa-input[name="event-log-from-filter"]')).not.toHaveAttribute('disabled');
      expect(container.querySelector('goa-input[name="event-log-to-filter"]')).not.toHaveAttribute('disabled');
      expect(onSearch).not.toHaveBeenCalled();
    },
  );

  it('submits custom Mountain Time boundaries as UTC and keeps Custom selected', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'custom');
    changeGoaInput(container.querySelector('goa-input[name="event-log-from-filter"]'), '2026-01-02T10:00');
    changeGoaInput(container.querySelector('goa-input[name="event-log-to-filter"]'), '2026-01-02T12:00');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ timestampMin: '2026-01-02T17:00:00.000Z', timestampMax: '2026-01-02T19:00:00.000Z' }),
    );
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toHaveAttribute(
      'value',
      'custom',
    );
  });

  it.each(['2026-01-01T12:00', '2026-01-02T12:00'])(
    'explains and prevents a custom end time that is not later than the start: %s',
    (end) => {
      const onSearch = jest.fn();
      const { container } = renderComponent({ onSearch });
      changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'custom');
      changeGoaInput(container.querySelector('goa-input[name="event-log-from-filter"]'), '2026-01-02T12:00');
      changeGoaInput(container.querySelector('goa-input[name="event-log-to-filter"]'), end);

      clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

      expect(container.querySelector('goa-form-item[error]')).toHaveAttribute(
        'error',
        'End date/time must be later than start date/time.',
      );
      expect(onSearch).not.toHaveBeenCalled();
    },
  );

  it('restores and executes Last 7 days after editing a custom range', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'custom');
    changeGoaInput(container.querySelector('goa-input[name="event-log-to-filter"]'), '');
    jest.setSystemTime(new Date('2026-10-20T18:30:00Z'));

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-reset"]'));

    expect(onSearch).toHaveBeenCalledWith(defaultEventLogCriteria());
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toHaveAttribute(
      'value',
      'last-7-days',
    );
    expect(container.querySelector('goa-input[name="event-log-from-filter"]')).toHaveAttribute('disabled');
    expect(container.querySelector('goa-input[name="event-log-to-filter"]')).toHaveAttribute('disabled');
    expect(container.querySelector('goa-input[name="event-log-from-filter"]')).toHaveAttribute(
      'value',
      '2026-10-13T12:30',
    );
    expect(container.querySelector('goa-input[name="event-log-to-filter"]')).toHaveAttribute(
      'value',
      '2026-10-20T12:30',
    );
  });

  it('disables Search when no criteria have been entered', () => {
    const { container } = renderComponent({ initialValue: {} });

    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toHaveAttribute('disabled');
  });

  it('clears the validation error when the end is corrected', () => {
    const { container } = renderComponent();
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'custom');
    changeGoaInput(container.querySelector('goa-input[name="event-log-from-filter"]'), '2026-01-02T12:00');
    changeGoaInput(container.querySelector('goa-input[name="event-log-to-filter"]'), '2026-01-02T12:00');

    changeGoaInput(container.querySelector('goa-input[name="event-log-to-filter"]'), '2026-01-02T13:00');

    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).not.toHaveAttribute('disabled');
    expect(container.querySelector('goa-form-item[error]')).not.toBeInTheDocument();
  });
});
