import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventSearchForm } from './eventSearchForm';
import { GoabButton } from '@abgov/react-components';

describe('EventSearchForm', () => {
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

  it('places the Filters button immediately before Search', () => {
    const { container } = renderComponent();

    const buttons = Array.from(container.querySelectorAll('goa-button-group goa-button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(buttons).toEqual(['Filters', 'Search', 'Reset']);
  });

  it('places Filters, Search, and Reset immediately after the left action', () => {
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

    expect(buttons).toEqual(['Download CSV', 'Filters', 'Search', 'Reset']);
    expect(container.querySelector('goa-button[testid="event-log-filters-toggle"]')).toHaveAttribute('size', 'compact');
    expect(container.querySelector('goa-button[testid="event-log-search"]')).toHaveAttribute('size', 'compact');
    expect(container.querySelector('goa-button[testid="event-log-reset"]')).toHaveAttribute('size', 'compact');
  });

  it('keeps the Search button enabled with a leading search icon', () => {
    const { container } = renderComponent();

    const searchButton = container.querySelector('goa-button[testid="event-log-search"]');

    expect(searchButton).not.toHaveAttribute('disabled');
    expect(searchButton).toHaveAttribute('leadingicon', 'search');
  });

  it('keeps the additional filter panel collapsed by default and toggles it without searching', () => {
    const onSearch = jest.fn();
    const { container, queryByLabelText } = renderComponent({ onSearch });

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
    expect(container.querySelector('goa-button[testid="event-log-clear-all-filters"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toBeInTheDocument();
    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toBeInTheDocument();
    expect(container.querySelector('goa-button[testid="event-log-filter-search"]')).toHaveAttribute('size', 'compact');
    expect(container.querySelector('goa-button[testid="event-log-clear-all-filters"]')).toHaveAttribute(
      'size',
      'compact',
    );
    expect(container.querySelector('[data-testid="event-log-filter-actions"]')).toContainElement(
      container.querySelector('goa-button[testid="event-log-clear-all-filters"]'),
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
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'all-dates');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-456');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'script-service',
        name: 'script-executed',
        correlationId: 'corr-456',
        timestampMin: '',
        timestampMax: '',
      }),
    );
  });

  it('submits drawer filters from the filter panel search button', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]'), 'all-dates');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-999');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filter-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'script-service',
        name: 'script-executed',
        correlationId: 'corr-999',
        timestampMin: '',
        timestampMax: '',
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

    clickGoaButton(container.querySelector('goa-button[testid="event-log-search"]'));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: 'script-service',
        name: 'script-executed',
      }),
    );
  });

  it('clears and closes the additional filter panel without searching', () => {
    const onSearch = jest.fn();
    const { container } = renderComponent({ onSearch });

    clickGoaButton(container.querySelector('goa-button[testid="event-log-filters-toggle"]'));
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]'), 'script-service');
    changeGoaDropdown(container.querySelector('goa-dropdown[name="event-log-name-filter"]'), 'script-executed');
    changeGoaInput(container.querySelector('goa-input[name="event-log-correlation-filter"]'), 'corr-789');

    clickGoaButton(container.querySelector('goa-button[testid="event-log-clear-all-filters"]'));

    expect(container.querySelector('goa-dropdown[name="event-log-namespace-filter"]')).toHaveAttribute(
      'value',
      'all-namespaces',
    );
    expect(container.querySelector('goa-dropdown[name="event-log-name-filter"]')).toHaveAttribute(
      'value',
      'all-event-names',
    );
    expect(container.querySelector('goa-input[name="event-log-correlation-filter"]')).toHaveAttribute('value', '');
    expect(onSearch).not.toHaveBeenCalled();

    fireEvent(
      container.querySelector('goa-drawer[testid="event-log-filter-panel"]') as Element,
      new CustomEvent('_close'),
    );
    expect(container.querySelector('goa-drawer[testid="event-log-filter-panel"]')).not.toHaveAttribute('open');
  });
});
