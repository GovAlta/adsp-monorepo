import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';
import { getEventDefinitions } from '@store/event/actions';
import { useSearchableDropdown, scoreFuzzyMatch, getFuzzyMatches } from '@core-services/app-common';
import { SearchBox, DateTimeInput } from './styled-components';
import { validateEventKey } from './util';
import { GoabButton, GoabIconButton, GoabButtonGroup, GoabGrid, GoabFormItem } from '@abgov/react-components';

const initCriteria: EventSearchCriteria = {
  namespace: '',
  name: '',
  timestampMax: '',
  timestampMin: '',
};
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
}

export const EventSearchForm: FunctionComponent<EventSearchFormProps> = ({ onCancel, onSearch }) => {
  const [searchCriteria, setSearchCriteria] = useState(() => defaultWeekCriteria());
  const [error, setError] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString().split('/').reverse().join('-');
  const defaultMessage = 'Use a colon (:) between namespace and name';
  const [message, setMessage] = useState<string | undefined>(defaultMessage);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  const events = useSelector((state: RootState) => state.event.definitions);

  const eventKey = Object.keys(events);
  const autoCompleteList = Object.keys(events).sort((a, b) => (a < b ? -1 : 1));
  const resolveCriteriaFromInput = (input: string): EventSearchCriteria | null => {
    const raw = (input ?? '').trim();
    if (!raw) return { ...searchCriteria, namespace: '', name: '' };

    // If user typed namespace:name explicitly
    if (raw.includes(':')) {
      const idx = raw.indexOf(':');
      const ns = raw.slice(0, idx).trim();
      const nm = raw.slice(idx + 1).trim();
      if (!ns || !nm) return null;
      return { ...searchCriteria, namespace: ns, name: nm };
    }

    // Free-text: pick best fuzzy suggestion
    const best = getFuzzyMatches(autoCompleteList, raw, 1)[0];
    if (!best) return null;

    const idx = best.indexOf(':');
    const ns = idx >= 0 ? best.slice(0, idx).trim() : '';
    const nm = idx >= 0 ? best.slice(idx + 1).trim() : best.trim();
    if (!ns || !nm) return null;

    return { ...searchCriteria, namespace: ns, name: nm };
  };

  const setValue = (name: string, value: string) => {
    setSearchCriteria({ ...searchCriteria, [name]: value });
  };

  const renderHighlight = (suggestion: string) => {
    if (!dd.query) return <span>{suggestion}</span>;
    const hay = suggestion.toLowerCase();
    const needle = dd.query.toLowerCase();
    const i = hay.indexOf(needle);
    if (i >= 0) {
      return (
        <span>
          {suggestion.substring(0, i)}
          <strong>{suggestion.substring(i, i + dd.query.length)}</strong>
          {suggestion.substring(i + dd.query.length)}
        </span>
      );
    }
    return <span>{suggestion}</span>;
  };
  const dd = useSearchableDropdown<string>({
    debounceMs: 0, // local results are instant
    minChars: 1, // start suggesting when user types
    getLocalItems: (q) => getFuzzyMatches(autoCompleteList, q, 80),

    // ✅ show full list when focusing empty input
    showAllOnFocus: true,
    allItemsOnEmptyQuery: () => autoCompleteList.slice(0, 80),

    closeOnSelect: true,
    onSelect: (value) => {
      // When user hits Enter or clicks a suggestion
      const resolved = resolveCriteriaFromInput(value);
      if (!resolved) {
        setError(true);
        return;
      }
      setError(false);
      setSearchCriteria(resolved);
      dd.setOpen(false);
      dd.setQuery(`${resolved.namespace}:${resolved.name}`);
    },
  });
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dd.open && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        dd.setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dd, dd.open, dd.setOpen]);
  // -----------------------------------
  // Input onChange: keep criteria in sync if user types ns:name
  // -----------------------------------
  const onInputChange = (value: string) => {
    dd.setQuery(value);
    setError(false);
    // ✅ do not close here

    if (value.includes(':')) {
      const [ns, nm] = value.split(':');
      setSearchCriteria({ ...searchCriteria, namespace: (ns ?? '').trim(), name: (nm ?? '').trim() });
    } else {
      setSearchCriteria({ ...searchCriteria, namespace: '', name: '' });
    }
  };

  return (
    <div>
      <GoabGrid minChildWidth="30ch" gap="xs">
        <SearchBox>
          <GoabFormItem
            helpText={error ? '' : message}
            error={error ? message : ''}
            label="Search event namespace and name"
          >
            <div ref={searchRef}>
              <div
                className={dd.open ? 'search search-open' : 'search'}
                onKeyDown={(e) => {
                  if (e.keyCode === 9) {
                    dd.setOpen(false);
                  }
                }}
              >
                <input
                  ref={dd.inputRef}
                  type="text"
                  name="searchBox"
                  value={dd.query}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    dd.onKeyDown(e.key);
                    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  aria-label="Search"
                  onFocus={dd.onFocus}
                  onClick={() => {
                    setError(false);
                    dd.onFocus();
                  }}
                />

                <GoabIconButton
                  icon={dd.open ? 'close-circle' : 'chevron-down'}
                  title="dropdown"
                  size="medium"
                  testId="menu-open-close"
                  variant="dark"
                  onClick={() => {
                    if (dd.open) {
                      dd.setQuery('');
                      dd.setOpen(false);

                      setError(false);
                      setSearchCriteria((prev) => ({ ...prev, namespace: '', name: '' }));
                      return;
                    }
                    dd.inputRef.current?.focus();

                    if (!dd.query.trim()) {
                      dd.openAll();
                    } else {
                      dd.setOpen(true);
                    }
                  }}
                />
              </div>
              {dd.open && dd.items.length > 0 && (
                <ul ref={dd.listRef} className="suggestions">
                  {dd.items.map((suggestion, index) => {
                    const className = index === dd.activeIndex ? 'suggestion-active' : undefined;
                    return (
                      <li
                        key={`${suggestion}-${index}`}
                        data-index={index}
                        className={className}
                        onMouseEnter={() => dd.setActiveIndex(index)}
                        onMouseDown={(e) => {
                          e.preventDefault(); // keep focus
                          dd.selectItem(suggestion); // triggers onSelect
                        }}
                      >
                        {renderHighlight(suggestion)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </GoabFormItem>
        </SearchBox>
        <GoabFormItem label="Minimum timestamp">
          <DateTimeInput
            type="datetime-local"
            name="timestampMin"
            max={today}
            aria-label="timestampMin"
            value={searchCriteria.timestampMin}
            onChange={(e) => setValue('timestampMin', e.target.value)}
            onClick={() => dd.setOpen(false)}
          />
        </GoabFormItem>
        <GoabFormItem label="Maximum timestamp">
          <DateTimeInput
            type="datetime-local"
            name="timestampMax"
            max={today}
            aria-label="timestampMax"
            value={searchCriteria.timestampMax}
            onChange={(e) => setValue('timestampMax', e.target.value)}
            onClick={() => dd.setOpen(false)}
          />
        </GoabFormItem>
      </GoabGrid>
      <GoabButtonGroup alignment="end">
        <GoabButton
          type="secondary"
          onClick={() => {
            dd.reset();
            setError(false);
            setSearchCriteria(initCriteria);
            onCancel?.();
          }}
        >
          Reset
        </GoabButton>
        <GoabButton
          disabled={dd.query.indexOf(':') === -1}
          onClick={() => {
            dd.setOpen(false);
            setError(false);

            const resolved = resolveCriteriaFromInput(dd.query);
            if (!resolved) {
              setError(true);
              return;
            }
            const validEvent = validateEventKey(dd.query, eventKey);
            if (!validEvent.ok) {
              setError(true);
              setMessage(validEvent.ok ? '' : validEvent.reason);
            } else {
              setSearchCriteria(resolved);
              setMessage(defaultMessage);
              dd.setQuery(`${resolved.namespace}:${resolved.name}`);
              onSearch?.(resolved);
            }
          }}
        >
          Search
        </GoabButton>
      </GoabButtonGroup>
    </div>
  );
};
