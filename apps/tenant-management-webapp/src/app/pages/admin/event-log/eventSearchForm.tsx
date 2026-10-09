import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';
import { getEventDefinitions } from '@store/event/actions';
import {
  SearchActions,
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
} from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

const initCriteria: EventSearchCriteria = {
  namespace: '',
  name: '',
  timestampMax: '',
  timestampMin: '',
};
const ALL_NAMESPACES = 'all-namespaces';
const ALL_EVENT_NAMES = 'all-event-names';
const DATE_RANGE_LAST_7_DAYS = 'last-7-days';
const DATE_RANGE_CUSTOM = 'custom';
const DATE_RANGE_ALL = 'all-dates';

function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultWeekCriteria(): EventSearchCriteria {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  return {
    namespace: '',
    name: '',
    timestampMin: toDateTimeLocalValue(weekAgo),
    timestampMax: toDateTimeLocalValue(now),
  };
}
interface EventSearchFormProps {
  initialValue?: EventSearchCriteria;
  onCancel?: () => void;
  onSearch?: (searchCriteria: EventSearchCriteria) => void;
  leftAction?: React.ReactNode;
}

export const EventSearchForm: FunctionComponent<EventSearchFormProps> = ({ onCancel, onSearch, leftAction }) => {
  const [searchCriteria, setSearchCriteria] = useState(() => defaultWeekCriteria());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState(DATE_RANGE_LAST_7_DAYS);

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

  const setDateRangeFilter = (value: string) => {
    setDateRange(value);
    if (value === DATE_RANGE_LAST_7_DAYS) {
      const weekCriteria = defaultWeekCriteria();
      setSearchCriteria((criteria) => ({
        ...criteria,
        timestampMin: weekCriteria.timestampMin,
        timestampMax: weekCriteria.timestampMax,
      }));
    }
    if (value === DATE_RANGE_ALL) {
      setSearchCriteria((criteria) => ({ ...criteria, timestampMin: '', timestampMax: '' }));
    }
  };

  const clearFilters = () => {
    setDateRange(DATE_RANGE_ALL);
    setSearchCriteria(initCriteria);
  };

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
            <GoabButton
              size="compact"
              leadingIcon="search"
              testId="event-log-search"
              onClick={() => {
                onSearch?.(searchCriteria);
              }}
            >
              Search
            </GoabButton>
            <GoabButton
              size="compact"
              type="secondary"
              testId="event-log-reset"
              onClick={() => {
                clearFilters();
                onCancel?.();
              }}
            >
              Reset
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
                  value={dateRange}
                  leadingIcon="calendar"
                  size="compact"
                  width="100%"
                  onChange={(detail) => setDateRangeFilter(detail.value as string)}
                >
                  <GoabDropdownItem value={DATE_RANGE_LAST_7_DAYS} label="Last 7 days" />
                  <GoabDropdownItem value={DATE_RANGE_CUSTOM} label="Custom range" />
                  <GoabDropdownItem value={DATE_RANGE_ALL} label="All dates" />
                </GoabDropdown>
                <div>From</div>
                <GoabInput
                  name="event-log-from-filter"
                  value={searchCriteria.timestampMin || ''}
                  leadingIcon="calendar"
                  size="compact"
                  width="100%"
                  disabled
                />
                <div>To</div>
                <GoabInput
                  name="event-log-to-filter"
                  value={searchCriteria.timestampMax || ''}
                  leadingIcon="calendar"
                  size="compact"
                  width="100%"
                  disabled
                />

                <div className="filter-label">Namespace</div>
                <GoabDropdown
                  name="event-log-namespace-filter"
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
              type="text"
              leadingIcon="reload"
              testId="event-log-clear-all-filters"
              onClick={clearFilters}
            >
              Clear all filters
            </GoabButton>
            <GoabButton
              size="compact"
              leadingIcon="search"
              testId="event-log-filter-search"
              onClick={() => {
                onSearch?.(searchCriteria);
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
    </div>
  );
};
