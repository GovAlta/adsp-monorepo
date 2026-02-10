import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';
import { distance } from 'fastest-levenshtein';
import { getEventDefinitions } from '@store/event/actions';
import styled from 'styled-components';
import { GoabButton, GoabIconButton, GoabButtonGroup, GoabGrid, GoabFormItem } from '@abgov/react-components';
const initCriteria: EventSearchCriteria = {
  namespace: '',
  name: '',
  timestampMax: '',
  timestampMin: '',
};

interface EventSearchFormProps {
  initialValue?: EventSearchCriteria;
  onCancel?: () => void;
  onSearch?: (searchCriteria: EventSearchCriteria) => void;
}

export const EventSearchForm: FunctionComponent<EventSearchFormProps> = ({ onCancel, onSearch }) => {
  const [searchCriteria, setSearchCriteria] = useState(initCriteria);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [searchBox, setSearchBox] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const today = new Date().toLocaleDateString().split('/').reverse().join('-');
  const message = 'Use a colon (:) between namespace and name';
  const dispatch = useDispatch();
  const [freeTextQuery, setFreeTextQuery] = useState('');
  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);
  const events = useSelector((state: RootState) => state.event.definitions);

  const autoCompleteList = Object.keys(events).sort((a, b) => (a < b ? -1 : 1));

  const suggestionOnChange = (e) => {
    const userInput = e.target.value;

    setSearchBox(userInput);
    setFreeTextQuery(userInput);
    setOpen(true);
    setError(false);

    const next = getSuggestions(autoCompleteList, userInput, 80);
    setFilteredSuggestions(next);
    setActiveSuggestionIndex(0);

    if (userInput.includes(':')) {
      const [ns, nm] = userInput.split(':');
      setSearchCriteria({ ...searchCriteria, namespace: (ns ?? '').trim(), name: (nm ?? '').trim() });
    } else {
      setSearchCriteria({ ...searchCriteria, namespace: '', name: '' });
    }
  };

  const selectSuggestion = (selectedValue: string) => {
    if (!selectedValue) return;

    setSearchBox(selectedValue);

    const idx = selectedValue.indexOf(':');
    const ns = idx >= 0 ? selectedValue.slice(0, idx) : '';
    const nm = idx >= 0 ? selectedValue.slice(idx + 1) : selectedValue;

    setSearchCriteria({
      ...searchCriteria,
      namespace: ns.trim(),
      name: nm.trim(),
    });
  };

  function handleItemOnClick(e, suggestion: string) {
    e.preventDefault();
    selectSuggestion(suggestion);
    setFilteredSuggestions([suggestion]);
    setOpen(false);
  }
  const resolveCriteriaFromInput = (input: string): EventSearchCriteria | null => {
    const raw = (input ?? '').trim();
    if (!raw) return null;

    // If user typed namespace:name explicitly
    if (raw.includes(':')) {
      const idx = raw.indexOf(':');
      const ns = raw.slice(0, idx).trim();
      const nm = raw.slice(idx + 1).trim();
      if (!ns || !nm) return null;
      return { ...searchCriteria, namespace: ns, name: nm };
    }

    // Free-text: pick best fuzzy suggestion
    const best = getSuggestions(autoCompleteList, raw, 1)[0];
    if (!best) return null;

    const idx = best.indexOf(':');
    const ns = idx >= 0 ? best.slice(0, idx).trim() : '';
    const nm = idx >= 0 ? best.slice(idx + 1).trim() : best.trim();
    if (!ns || !nm) return null;

    return { ...searchCriteria, namespace: ns, name: nm };
  };

  const onKeyDown = (e) => {
    setError(false);
    setOpen(true);
    if (e.keyCode === 9) {
      setOpen(false);
    } else if (e.keyCode === 13) {
      e.preventDefault();
      setOpen(false);
      setError(false);

      const inputValue = (e.currentTarget as HTMLInputElement).value;

      const resolved = resolveCriteriaFromInput(inputValue);

      if (!resolved) {
        setError(true);
        return;
      }
      setSearchCriteria(resolved);
      setSearchBox(`${resolved.namespace}:${resolved.name}`);
      onSearch?.(resolved);
    } else if (e.keyCode === 38) {
      if (activeSuggestionIndex === 0) {
        return;
      }
      setActiveSuggestionIndex(activeSuggestionIndex - 1);
    } else if (e.keyCode === 40) {
      if (activeSuggestionIndex === filteredSuggestions.length - 1) {
        return;
      }
      setActiveSuggestionIndex(activeSuggestionIndex + 1);
    }
  };

  function normalize(s: string): string {
    return s
      .toLowerCase()
      // eslint-disable-next-line
      .replace(/[_:\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scoreMatch(queryRaw: string, candidateRaw: string): number {
    const q = normalize(queryRaw);
    const c = normalize(candidateRaw);
    const levenshteinAccuracyThread = 0.4;
    if (!q) return 0;

    const qTokens = q.split(' ').filter(Boolean);
    const cTokens = c.split(' ').filter(Boolean);

    // 1) Exact normalized substring (best)
    if (c.includes(q)) return 100;

    // 2) Prefix match on any token (makes "log" work for "login")
    // Boost if matches earlier tokens
    let prefixHits = 0;
    for (const qt of qTokens) {
      for (let i = 0; i < cTokens.length; i++) {
        if (cTokens[i].startsWith(qt)) {
          prefixHits++;
          break;
        }
      }
    }
    if (prefixHits > 0) return 80 + prefixHits * 5;

    // 3) Loose contains match per token (for "train" in "training")
    let containsHits = 0;
    for (const qt of qTokens) {
      if (c.includes(qt)) {
        containsHits++;
      }
    }
    if (containsHits > 0) return 60 + containsHits * 8;

    // 4) Evaluate the similarity between the words to handle simple typo of search criteria.
    if (q.length > 3) {
      const word_distance = distance(q, c.slice(0, q.length));
      const accuracy = 1 - word_distance / q.length;
      if (accuracy > levenshteinAccuracyThread) {
        return accuracy * 100;
      }

    }

    return 0;
  }

  function getSuggestions(list: string[], input: string, limit = 50): string[] {
    const q = input.trim();
    if (!q) return list.slice(0, limit);

    return list
      .map((s) => ({ s, score: scoreMatch(q, s) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.s);
  }

  const renderHighlight = (suggestion) => {
    if (!searchBox) return <span>{suggestion}</span>;

    const hay = suggestion.toLowerCase();
    const needle = searchBox.toLowerCase();
    const i = hay.indexOf(needle);

    if (i >= 0) {
      return (
        <span>
          {suggestion.substr(0, i)}
          <strong>{suggestion.substr(i, searchBox.length)}</strong>
          {suggestion.substr(i + searchBox.length)}
        </span>
      );
    }
    return <span>{suggestion}</span>;
  };
  const resolveCriteriaForSearch = (): EventSearchCriteria | null => {
    // If already selected
    if (searchCriteria.namespace?.trim() && searchCriteria.name?.trim()) return searchCriteria;

    // Colon typed: rely on current parsing/validation
    if (searchBox.includes(':')) return searchCriteria;

    // Free-text: pick best suggestion
    const best = getSuggestions(autoCompleteList, searchBox, 1)[0];
    if (!best) return null;

    const idx = best.indexOf(':');
    const ns = idx >= 0 ? best.slice(0, idx).trim() : '';
    const nm = idx >= 0 ? best.slice(idx + 1).trim() : best.trim();

    return { ...searchCriteria, namespace: ns, name: nm };
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
            <div
              className={open ? 'search search-open' : 'search'}
              onKeyDown={(e) => {
                if (e.keyCode === 9) {
                  setOpen(false);
                }
              }}
            >
              <input
                type="text"
                name="searchBox"
                value={searchBox}
                onChange={suggestionOnChange}
                onKeyDown={onKeyDown}
                aria-label="Search"
                onClick={(e) => {
                  e.preventDefault();
                  setError(false);
                  setOpen(!open);
                  if (!open && searchBox.length === 0) {
                    setFilteredSuggestions(autoCompleteList);
                  }
                }}
              />

              <GoabIconButton
                icon={open ? 'close-circle' : 'chevron-down'}
                title="dropdown"
                size="medium"
                testId="menu-open-close"
                variant="dark"
                onClick={() => {
                  if (!open && searchBox.length === 0) {
                    setFilteredSuggestions(autoCompleteList);
                  }
                  if (open && searchBox.length > 0) {
                    setSearchBox('');
                    setSearchCriteria({ ...searchCriteria, namespace: '', name: '' });
                  }
                  setOpen(!open);
                }}
              />
            </div>

            {open && autoCompleteList && (
              <ul className="suggestions">
                {filteredSuggestions.map((suggestion, index) => {
                  let className;
                  if (index === activeSuggestionIndex) {
                    className = 'suggestion-active';
                  }
                  return (
                    <li className={className} key={index} onClick={(e) => handleItemOnClick(e, suggestion)}>
                      {renderHighlight(suggestion)}
                    </li>
                  );
                })}
              </ul>
            )}
          </GoabFormItem>
        </SearchBox>
        {/* <GoabFormItem label="Minimum timestamp">
          <DateTimeInput
            type="datetime-local"
            name="timestampMin"
            max={today}
            aria-label="timestampMin"
            value={searchCriteria.timestampMin}
            onChange={(e) => setValue('timestampMin', e.target.value)}
            onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
          />
        </GoabFormItem> */}
      </GoabGrid>
      <GoabButtonGroup alignment="end">
        <GoabButton
          type="secondary"
          onClick={() => {
            setOpen(false);
            setError(false);
            setSearchCriteria(initCriteria);
            setSearchBox('');
            onCancel();
          }}
        >
          Reset
        </GoabButton>
        <GoabButton
          onClick={() => {
            setOpen(false);
            setError(false);

            const resolved = resolveCriteriaFromInput(searchBox);

            if (!resolved) {
              setError(true);
              return;
            }

            setSearchCriteria(resolved);
            setSearchBox(`${resolved.namespace}:${resolved.name}`);
            onSearch?.(resolved);
          }}
        >
          Search
        </GoabButton>
      </GoabButtonGroup>
    </div>
  );
};

const SearchBox = styled.div`
  position: relative;
  .search {
    display: flex;
    border: 1px solid var(--color-gray-700);
    border-radius: 3px;
    padding: 0.16rem;
  }
  .search-open {
    border: 1px solid var(--color-orange);
  }
  .goa-state--error .search {
    border: 1px solid var(--color-red);
  }
  input {
    border-width: 0;
    width: 100%;
  }
  input:focus {
    outline: none;
  }
  .suggestions {
    border: 1px solid var(--color-gray-700);
    border-top-width: 0;
    list-style: none;
    margin-top: 0;
    max-height: 15.5rem;
    width: 100%;
    position: absolute;

    background: var(--color-white);
    box-shadow: 0 8px 8px rgb(0 0 0 / 20%), 0 4px 4px rgb(0 0 0 / 10%);
    z-index: 99;
    padding-left: 0px;

    overflow: hidden auto;
  }
  .suggestions li {
    padding: 0.5rem;
    color: var(--color-gray-900);
  }

  .suggestions li:hover {
    background-color: var(--color-primary);
    color: var(--color-white);
    cursor: pointer;
    font-weight: var(--fw-bold);
  }
`;

const DateTimeInput = styled.input`
  display: flex;
  align-content: center;
  width: 100%;
  line-height: var(--input-height);
  height: var(--input-height);
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  > input {
    border: none;
  }
  :hover {
    border-color: var(--color-blue-600);
  }
  :active,
  :focus {
    border-color: #004f84;
    box-shadow: 0 0 0 3px #feba35;
    outline: none;
  }
`;
