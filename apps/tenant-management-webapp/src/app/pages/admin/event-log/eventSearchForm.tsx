import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';

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

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);
  const events = useSelector((state: RootState) => state.event.definitions);

  const autoCompleteList = Object.keys(events).sort((a, b) => (a < b ? -1 : 1));

  const suggestionOnChange = (e) => {
    const userInput = e.target.value;
    const unLinked = autoCompleteList.filter(
      (suggestion) => suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
    );
    setSearchBox(userInput);
    setFilteredSuggestions(unLinked);
    setActiveSuggestionIndex(0);

    if (userInput.indexOf(':') === 0) {
      setSearchCriteria({ ...searchCriteria, namespace: '', name: userInput.substr(1) });
    } else if (userInput.indexOf(':') > 0) {
      const nameAndSpace = userInput.split(':');
      setSearchCriteria({ ...searchCriteria, namespace: nameAndSpace[0], name: nameAndSpace[1] });
    } else {
      setSearchCriteria({ ...searchCriteria, namespace: '', name: '' });
    }
  };

  const setValue = (name: string, value: string) => {
    setSearchCriteria({ ...searchCriteria, [name]: value });
  };

  const selectSuggestion = (selectedValue: string) => {
    setSearchBox(selectedValue);
    const nameAndSpace = selectedValue.split(':');
    setSearchCriteria({ ...searchCriteria, namespace: nameAndSpace[0], name: nameAndSpace[1] });
  };

  function handleItemOnClick(e, suggestion: string) {
    e.preventDefault();
    selectSuggestion(suggestion);
    setFilteredSuggestions([suggestion]);
    setOpen(false);
  }

  const onKeyDown = (e) => {
    setError(false);
    setOpen(true);
    if (e.keyCode === 9) {
      setOpen(false);
    } else if (e.keyCode === 13) {
      setActiveSuggestionIndex(0);
      setOpen(false);
      selectSuggestion(filteredSuggestions[activeSuggestionIndex]);
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

  const validation = () => {
    if (searchBox && searchBox.indexOf(':') < 0) {
      setError(true);
      return false;
    }
    return true;
  };

  const renderHighlight = (suggestion) => {
    const suggestIndex = suggestion.indexOf(searchBox);
    if (suggestIndex === 0) {
      return (
        <span>
          <strong>{suggestion.substr(0, searchBox.length)}</strong>
          {suggestion.substr(searchBox.length)}
        </span>
      );
    } else if (suggestIndex > 0) {
      return (
        <span>
          {suggestion.substr(0, suggestIndex)}
          <strong>{suggestion.substr(suggestIndex, searchBox.length)}</strong>
          {suggestion.substr(searchBox.length + suggestIndex)}
        </span>
      );
    } else {
      return;
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
        <GoabFormItem label="Minimum timestamp">
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
        </GoabFormItem>
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
            if (validation()) {
              onSearch(searchCriteria);
            }
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
