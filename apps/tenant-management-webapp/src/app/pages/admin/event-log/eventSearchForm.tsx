import React, { FunctionComponent, useState, useEffect } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import type { EventSearchCriteria } from '@store/event/models';
import { GoAButton } from '@abgov/react-components';
import {
  GoAForm,
  GoAFormItem,
  GoAFormActions,
  GoAInput,
  GoAFlexRow,
  GoAIcon,
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
    switch (name) {
      case 'TimeStampMin':
        setSearchCriteria({ ...searchCriteria, timestampMin: value });
        break;
      case 'TimeStampMax':
        setSearchCriteria({ ...searchCriteria, timestampMax: value });
        break;
    }
  };

  const onKeyDown = (e) => {
    setError(false);
    setOpen(true);
    if (e.keyCode === 13) {
      setActiveSuggestionIndex(0);
      setOpen(false);
      setSearchBox(filteredSuggestions[activeSuggestionIndex]);
      const nameAndSpace = filteredSuggestions[activeSuggestionIndex].split(':');
      setSearchCriteria({ ...searchCriteria, namespace: nameAndSpace[0], name: nameAndSpace[1] });
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
    if (searchBox.indexOf(':') < 0) {
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
        <SearchBox
          style={{ flexBasis: '45%' }}
          onClick={(e) => {
            e.preventDefault();
            setError(false);
            setOpen(!open);
            if (!open && searchBox.length === 0) {
              setFilteredSuggestions(autoCompleteList);
            } else {
              setSearchBox('');
            }
          }}
        >
          <GoAFormItem helpText={!open && !error && message}>
            <label>Search event namespace and name</label>
            <div className={error ? 'search search-error' : open ? 'search search-open' : 'search'}>
              <input
                type="text"
                name="searchBox"
                value={searchBox}
                onChange={suggestionOnChange}
                onKeyDown={onKeyDown}
              />
              <GoAIcon type={open ? 'close-circle' : 'chevron-down'} size="medium" />
            </div>
            {open && autoCompleteList && (
              <ul className="suggestions">
                {filteredSuggestions.map((suggestion, index) => {
                  let className;
                  if (index === activeSuggestionIndex) {
                    className = 'suggestion-active';
                  }
                  return (
                    <li
                      className={className}
                      key={suggestion}
                      onClick={(e) => {
                        setSearchBox(suggestion);
                        setFilteredSuggestions([suggestion]);
                        const nameAndSpace = suggestion.split(':');
                        setSearchCriteria({ ...searchCriteria, namespace: nameAndSpace[0], name: nameAndSpace[1] });
                      }}
                    >
                      {renderHighlight(suggestion)}
                    </li>
                  );
                })}
              </ul>
            )}
            {error && <div className="error-msg">{message}</div>}
          </GoAFormItem>
        </SearchBox>
        <GoAFormItem>
          <label>Minimum Timestamp</label>
          <GoAInput
            type="datetime-local"
            name="TimeStampMin"
            max={today}
            value={searchCriteria.timestampMin}
            onChange={setValue}
          />
        </GoAFormItem>
        <GoAFormItem>
          <label>Maximum Timestamp</label>
          <GoAInput
            type="datetime-local"
            name="TimeStampMax"
            max={today}
            value={searchCriteria.timestampMax}
            onChange={setValue}
          />
        </GoAFormItem>
      </GoAFlexRow>
      <GoAFormActions alignment="right">
        <GoAButton
          buttonType="tertiary"
          type="reset"
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
          buttonType="primary"
          type="submit"
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
    padding: 0.5rem;
  }
  .search-open {
    border: 3px solid var(--color-orange);
  }
  .search-error {
    border: 3px solid var(--color-red);
  }
  input {
    border-width: 0;
  }
  input:focus {
    outline: none;
  }
  .error-msg {
    display: block;
    color: var(--color-red);
  }
  .suggestions {
    border: 1px solid var(--color-gray-700);
    border-top-width: 0;
    list-style: none;
    margin-top: 0;
    max-height: 243px;
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
    font-weight: 700;
  }
`;
