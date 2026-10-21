import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';
import { getEventDefinitions } from '@store/event/actions';
import {
  SearchActions,
  ActiveFilters,
  FilterControls,
  FilterDrawerFooterActions,
  FilterDrawerHeading,
  FilterPanelGrid,
  MoreFilters,
} from './styled-components';
import {
  GoabAccordion,
  GoabButton,
  GoabButtonGroup,
  GoabDrawer,
  GoabDropdown,
  GoabDropdownItem,
  GoabInput,
  GoabFormItem,
  GoabFilterChip,
} from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import {
  DATE_RANGE_OPTIONS,
  DEFAULT_DATE_RANGE,
  DateRangePreset,
  dateRangeCriteria,
  defaultEventLogCriteria,
  fromDateTimeLocalValue,
  getDateRangeLabel,
  getDateRangePreset,
  isValidDateRange,
  toDateTimeLocalValue,
} from './util';

const ALL_NAMESPACES = 'all-namespaces';
const ALL_EVENT_NAMES = 'all-event-names';
const DATE_RANGE_CUSTOM = 'custom';

interface EventSearchFormProps {
  disabled?: boolean;
  initialValue?: EventSearchCriteria;
  onSearch?: (searchCriteria: EventSearchCriteria) => void;
  leftAction?: React.ReactNode;
}

export const EventSearchForm: FunctionComponent<EventSearchFormProps> = ({
  disabled = false,
  initialValue,
  onSearch,
  leftAction,
}) => {
  const [appliedCriteria, setAppliedCriteria] = useState(initialValue || defaultEventLogCriteria);
  const [searchCriteria, setSearchCriteria] = useState(appliedCriteria);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState(() => getDateRangePreset(appliedCriteria));
  const [appliedDateRange, setAppliedDateRange] = useState(dateRange);
  const appliedRangeRef = useRef({ criteria: appliedCriteria, preset: dateRange });
  const [customStart, setCustomStart] = useState(() =>
    appliedCriteria.timestampMin ? toDateTimeLocalValue(new Date(appliedCriteria.timestampMin)) : '',
  );
  const [customEnd, setCustomEnd] = useState(() =>
    appliedCriteria.timestampMax ? toDateTimeLocalValue(new Date(appliedCriteria.timestampMax)) : '',
  );

  useEffect(() => {
    if (initialValue) {
      setAppliedCriteria(initialValue);
      setSearchCriteria(initialValue);
      const previous = appliedRangeRef.current;
      const preset =
        initialValue.timestampMin === previous.criteria.timestampMin &&
        initialValue.timestampMax === previous.criteria.timestampMax
          ? previous.preset
          : getDateRangePreset(initialValue);
      setDateRange(preset);
      setAppliedDateRange(preset);
      setCustomStart(initialValue.timestampMin ? toDateTimeLocalValue(new Date(initialValue.timestampMin)) : '');
      setCustomEnd(initialValue.timestampMax ? toDateTimeLocalValue(new Date(initialValue.timestampMax)) : '');
      appliedRangeRef.current = { criteria: initialValue, preset };
    }
  }, [initialValue]);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  const events = useSelector((state: RootState) => state.event.definitions);

  const eventDefinitions = Object.values(events);
  const filterNamespace = searchCriteria.namespace || ALL_NAMESPACES;
  const filterEventName = searchCriteria.name || ALL_EVENT_NAMES;
  const filterNamespaces = Array.from(new Set(eventDefinitions.map((event) => event.namespace))).sort((a, b) =>
    a.localeCompare(b),
  );
  const filterEventNames = Array.from(
    new Set(
      eventDefinitions
        .filter((event) => filterNamespace === ALL_NAMESPACES || event.namespace === filterNamespace)
        .map((event) => event.name),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const setEventFilter = (name: 'namespace' | 'name', value: string) => {
    setSearchCriteria((criteria) => {
      const next: EventSearchCriteria = {
        ...criteria,
        [name]: value === ALL_NAMESPACES || value === ALL_EVENT_NAMES ? '' : value,
      };
      if (name === 'namespace') {
        next.name = '';
      }

      return next;
    });
  };

  const setDateRangeFilter = (value: DateRangePreset) => {
    if (disabled || !value || !DATE_RANGE_OPTIONS.some((option) => option.value === value)) return;
    let dates = searchCriteria;
    if (value !== DATE_RANGE_CUSTOM) {
      dates = dateRangeCriteria(value);
    } else if (dateRange !== DATE_RANGE_CUSTOM) {
      dates = dateRange ? dateRangeCriteria(dateRange) : defaultEventLogCriteria();
    }
    setDateRange(value);
    setCustomStart(dates.timestampMin ? toDateTimeLocalValue(new Date(dates.timestampMin)) : '');
    setCustomEnd(dates.timestampMax ? toDateTimeLocalValue(new Date(dates.timestampMax)) : '');
    setSearchCriteria((criteria) => ({
      ...criteria,
      timestampMin: dates.timestampMin,
      timestampMax: dates.timestampMax,
    }));
  };

  const applyCriteria = (criteria: EventSearchCriteria, preset = dateRange) => {
    if (disabled) return;
    setAppliedCriteria(criteria);
    setSearchCriteria(criteria);
    setDateRange(preset);
    setAppliedDateRange(preset);
    setCustomStart(criteria.timestampMin ? toDateTimeLocalValue(new Date(criteria.timestampMin)) : '');
    setCustomEnd(criteria.timestampMax ? toDateTimeLocalValue(new Date(criteria.timestampMax)) : '');
    appliedRangeRef.current = { criteria, preset };
    onSearch?.(criteria);
  };

  const getDateRangeError = () => {
    if (dateRange !== DATE_RANGE_CUSTOM || isValidDateRange(searchCriteria)) return undefined;
    if (!searchCriteria.timestampMin || !searchCriteria.timestampMax) return 'Enter a valid start and end date/time.';
    return 'End date/time must be later than start date/time.';
  };
  const dateRangeError = getDateRangeError();
  const hasSearchCriteria = Boolean(
    dateRange || searchCriteria.namespace || searchCriteria.name || searchCriteria.correlationId,
  );

  const removeFilter = (key: 'dateRange' | 'namespace' | 'name' | 'correlationId') => {
    if (disabled) return;
    const criteria = { ...appliedCriteria };
    if (key === 'dateRange') {
      criteria.timestampMin = '';
      criteria.timestampMax = '';
    } else {
      criteria[key] = '';
    }
    applyCriteria(criteria, key === 'dateRange' ? '' : appliedDateRange);
  };

  const badges = [
    { key: 'dateRange' as const, label: 'Date range', value: getDateRangeLabel(appliedCriteria, appliedDateRange) },
    { key: 'namespace' as const, label: 'Namespace', value: appliedCriteria.namespace },
    { key: 'name' as const, label: 'Event name', value: appliedCriteria.name },
    { key: 'correlationId' as const, label: 'Correlation ID', value: appliedCriteria.correlationId },
  ].filter((badge) => badge.value);

  return (
    <div>
      <SearchActions>
        <div>{leftAction}</div>
        <FilterControls>
          <GoabButtonGroup alignment="end">
            <GoabButton
              size="compact"
              type="secondary"
              leadingIcon="filter"
              trailingIcon={filtersOpen ? 'chevron-back' : 'chevron-forward'}
              onClick={() => setFiltersOpen((open) => !open)}
              testId="event-log-filters-toggle"
            >
              Filters
            </GoabButton>
          </GoabButtonGroup>
        </FilterControls>
      </SearchActions>
      <GoabDrawer
        heading={
          <FilterDrawerHeading>
            <div>
              <h2>Filters</h2>
              <p>Add one or more filters to narrow the results. All selected filters are applied together.</p>
              <FilterPanelGrid>
                <div className="filter-label">Date range</div>
                <GoabDropdown
                  name="event-log-date-range-filter"
                  ariaLabel="Date range"
                  native
                  disabled={disabled}
                  value={dateRange}
                  leadingIcon="calendar"
                  size="compact"
                  width="100%"
                  onChange={(detail) => setDateRangeFilter(detail.value as DateRangePreset)}
                >
                  {!dateRange && <GoabDropdownItem value="" label="Select date range" />}
                  {DATE_RANGE_OPTIONS.map(({ value, label }) => (
                    <GoabDropdownItem key={value} value={value} label={label} />
                  ))}
                </GoabDropdown>
                {dateRange && (
                  <>
                    <GoabFormItem label="From (Mountain Time)" maxWidth="100%">
                      <GoabInput
                        name="event-log-from-filter"
                        ariaLabel="From (Mountain Time)"
                        type="datetime-local"
                        value={customStart}
                        size="compact"
                        width="100%"
                        disabled={disabled || dateRange !== DATE_RANGE_CUSTOM}
                        onChange={(detail) => {
                          setCustomStart(detail.value);
                          setSearchCriteria((criteria) => ({
                            ...criteria,
                            timestampMin: fromDateTimeLocalValue(detail.value),
                          }));
                        }}
                      />
                    </GoabFormItem>
                    <GoabFormItem label="To (Mountain Time)" error={dateRangeError} maxWidth="100%">
                      <GoabInput
                        name="event-log-to-filter"
                        ariaLabel="To (Mountain Time)"
                        type="datetime-local"
                        value={customEnd}
                        size="compact"
                        width="100%"
                        disabled={disabled || dateRange !== DATE_RANGE_CUSTOM}
                        error={Boolean(dateRangeError)}
                        onChange={(detail) => {
                          setCustomEnd(detail.value);
                          setSearchCriteria((criteria) => ({
                            ...criteria,
                            timestampMax: fromDateTimeLocalValue(detail.value),
                          }));
                        }}
                      />
                    </GoabFormItem>
                  </>
                )}

                <div className="filter-label">Namespace</div>
                <GoabDropdown
                  name="event-log-namespace-filter"
                  native
                  disabled={disabled}
                  value={filterNamespace}
                  size="compact"
                  width="100%"
                  onChange={(detail) => {
                    setEventFilter('namespace', detail.value as string);
                  }}
                >
                  <GoabDropdownItem value={ALL_NAMESPACES} label="All namespaces" />
                  {filterNamespaces.map((namespace) => (
                    <GoabDropdownItem key={namespace} value={namespace} label={namespace} />
                  ))}
                </GoabDropdown>
                <div className="filter-label">Event name</div>
                <GoabDropdown
                  name="event-log-name-filter"
                  native
                  disabled={disabled}
                  value={filterEventName}
                  size="compact"
                  width="100%"
                  onChange={(detail) => setEventFilter('name', detail.value as string)}
                >
                  <GoabDropdownItem value={ALL_EVENT_NAMES} label="All event names" />
                  {filterEventNames.map((name) => (
                    <GoabDropdownItem key={name} value={name} label={name} />
                  ))}
                </GoabDropdown>
                <div className="filter-label">Correlation ID</div>
                <GoabInput
                  name="event-log-correlation-filter"
                  ariaLabel="Correlation ID"
                  disabled={disabled}
                  placeholder="Enter correlation ID"
                  width="100%"
                  size="compact"
                  value={searchCriteria.correlationId || ''}
                  onChange={(detail: GoabInputOnChangeDetail) =>
                    setSearchCriteria((criteria) => ({ ...criteria, correlationId: detail.value }))
                  }
                />
              </FilterPanelGrid>
            </div>
          </FilterDrawerHeading>
        }
        position="right"
        open={filtersOpen}
        testId="event-log-filter-panel"
        maxSize="480px"
        onClose={() => setFiltersOpen(false)}
        actions={
          <FilterDrawerFooterActions data-testid="event-log-filter-actions">
            <GoabButton
              size="compact"
              type="secondary"
              leadingIcon="reload"
              testId="event-log-filter-reset"
              disabled={disabled}
              onClick={() => {
                applyCriteria(defaultEventLogCriteria(), DEFAULT_DATE_RANGE);
              }}
            >
              Reset
            </GoabButton>
            <GoabButton
              size="compact"
              type="secondary"
              leadingIcon="close"
              testId="event-log-filter-close"
              onClick={() => setFiltersOpen(false)}
            >
              Close
            </GoabButton>
            <GoabButton
              size="compact"
              leadingIcon="search"
              testId="event-log-filter-search"
              disabled={disabled || !hasSearchCriteria || Boolean(dateRangeError)}
              onClick={() => {
                if (!hasSearchCriteria || dateRangeError) return;
                const dates =
                  !dateRange || dateRange === DATE_RANGE_CUSTOM ? searchCriteria : dateRangeCriteria(dateRange);
                const criteria = {
                  ...searchCriteria,
                  timestampMin: dates.timestampMin,
                  timestampMax: dates.timestampMax,
                };
                applyCriteria(criteria);
              }}
            >
              Search
            </GoabButton>
          </FilterDrawerFooterActions>
        }
      >
        {filtersOpen && (
          <MoreFilters>
            <GoabAccordion
              heading="More filters (optional)"
              headingSize="small"
              iconPosition="left"
              maxWidth="none"
              testId="event-log-more-filters"
            >
              <span />
            </GoabAccordion>
          </MoreFilters>
        )}
      </GoabDrawer>
      <ActiveFilters role="group" aria-label="Active event log filters" aria-busy={disabled}>
        {badges.map(({ key, label, value }) => (
          <GoabFilterChip
            key={key}
            content={`${label}: ${value}`}
            testId={`event-log-filter-badge-${key}`}
            onClick={() => removeFilter(key)}
          />
        ))}
      </ActiveFilters>
    </div>
  );
};
