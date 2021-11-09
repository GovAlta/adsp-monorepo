import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';

import {
  GoAForm,
  GoAFormItem,
  GoAFormActions,
  GoAFlexRow,
  GoAInputDateTime,
  GoAIconButton,
  GoAButton,
} from '@abgov/react-components/experimental';
import { getEventDefinitions } from '@store/event/actions';
import styled from 'styled-components';
import '@abgov/core-css/src/lib/styles/v2/colors.scss';

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
  const autoCompleteList = Object.keys(events);

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
    if (e.keyCode === 13) {
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
    <GoAForm>
      <GoAFlexRow gap="small">
        <SearchBox style={{ flexBasis: '40%' }}>
          <GoAFormItem helpText={!open && !error && message} error={error && message}>
            <label>Search event namespace and name</label>
            <div className={open ? 'search search-open' : 'search'}>
              <input
                type="text"
                name="searchBox"
                value={searchBox}
                onChange={suggestionOnChange}
                onKeyDown={onKeyDown}
                onClick={(e) => {
                  e.preventDefault();
                  setError(false);
                  setOpen(!open);
                  if (!open && searchBox.length === 0) {
                    setFilteredSuggestions(autoCompleteList);
                  }
                }}
              />
              <GoAIconButton
                type={open ? 'close-circle' : 'chevron-down'}
                size="medium"
                variant="round"
                testId="menu-open-close"
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
          </GoAFormItem>
        </SearchBox>
        <GoAFormItem>
          <label>Minimum Timestamp</label>
          <GoAInputDateTime name="timestampMin" max={today} value={searchCriteria.timestampMin} onChange={setValue} />
        </GoAFormItem>
        <GoAFormItem>
          <label>Maximum Timestamp</label>
          <GoAInputDateTime name="timestampMax" max={today} value={searchCriteria.timestampMax} onChange={setValue} />
        </GoAFormItem>
      </GoAFlexRow>
      <GoAFormActions alignment="right">
        <GoAButton
          title="Reset"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            setError(false);
            setSearchCriteria(initCriteria);
            setSearchBox('');
            onCancel();
          }}
        >
          Reset
        </GoAButton>
        <GoAButton
          title="Search"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            if (validation()) {
              onSearch(searchCriteria);
            }
          }}
        >
          Search
        </GoAButton>
      </GoAFormActions>
    </GoAForm>
  );
};

const SearchBox = styled.div`
  .search {
    display: flex;
    border: 1px solid var(--color-gray-700);
    border-radius: 3px;
    padding: 0.15rem;
  }
  .search-open {
    border: 2px solid var(--color-orange);
  }
  .goa-state--error .search {
    border: 2px solid var(--color-red);
  }
  input {
    border-width: 0;
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
    overflow-y: auto;
    padding-left: 0;
    width: 100%;
  }
  .suggestions li {
    padding: 0.5rem;
  }
  .suggestion-active,
  .suggestions li:hover {
    background-color: var(--color-primary);
    color: var(--color-white);
    cursor: pointer;
    font-weight: var(--fw-bold);
  }
`;
