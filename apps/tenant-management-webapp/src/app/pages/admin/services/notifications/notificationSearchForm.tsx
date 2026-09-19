import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { GoabButton, GoabFormItem, GoabInput } from '@abgov/react-components';
import { GoabInputOnChangeDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
import { useDebounce } from '@lib/useDebounce';
import { hideDecorativeIcons } from '@lib/hideDecorativeIcons';
import styled from 'styled-components';

// Long enough that a search is not run on every keystroke, short enough that the results feel like
// they follow the typing.
export const SEARCH_DEBOUNCE_MS = 800;

interface NotificationSearchFormProps {
  searchValue: string;
  onSearch: (search: string) => void;
  onReset: () => void;
  ariaLabel: string;
  placeholder: string;
  inputTestId: string;
  resetButtonTestId: string;
  label?: string;
  name?: string;
}

export const NotificationSearchForm: FunctionComponent<NotificationSearchFormProps> = ({
  searchValue,
  onSearch,
  onReset,
  ariaLabel,
  placeholder,
  inputTestId,
  resetButtonTestId,
  label,
  name = 'search',
}) => {
  // The field is driven from local state so that what was typed is on screen immediately. The web
  // component writes an incoming value prop back over the box, so a value that lags the typing
  // would take the characters between with it.
  const [search, setSearch] = useState(searchValue || '');

  // What was last handed to the caller. The caller passes it back down, and that echo must not be
  // mistaken for someone setting the search from outside.
  const committed = useRef(searchValue || '');

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    if ((searchValue || '') !== committed.current) {
      committed.current = searchValue || '';
      setSearch(searchValue || '');
    }
  }, [searchValue]);

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS) as string;

  // The field's own aria-label and the clear icon's trailingIconAriaLabel already name these
  // controls, so the search/close icons rendered beside them are purely decorative.
  useEffect(() => hideDecorativeIcons(`[testid="${inputTestId}"]`), [inputTestId]);

  useEffect(() => {
    if (debouncedSearch !== committed.current) {
      committed.current = debouncedSearch;
      onSearchRef.current(debouncedSearch);
    }
  }, [debouncedSearch]);

  // Searching is what the typing already does; this only skips the wait.
  const searchNow = (value: string) => {
    committed.current = value;
    onSearchRef.current(value);
  };

  const input = (
    <GoabInput
      size="compact"
      name={name}
      testId={inputTestId}
      id={name}
      width="100%"
      value={search}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      leadingIcon="search"
      trailingIcon={search ? 'close' : undefined}
      trailingIconAriaLabel="Clear search"
      onTrailingIconClick={() => {
        setSearch('');
        searchNow('');
      }}
      // Driven from the change event rather than a key event, so that pasting and holding a key
      // down are picked up the same way typing is.
      onChange={(detail: GoabInputOnChangeDetail) => setSearch(detail.value)}
      onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
        if (detail.key === 'Enter') {
          setSearch(detail.value);
          searchNow(detail.value);
        }
      }}
    />
  );

  return (
    <SearchRow>
      {label ? <GoabFormItem label={label}>{input}</GoabFormItem> : input}
      <GoabButton
        size="compact"
        type="tertiary"
        testId={resetButtonTestId}
        onClick={() => {
          setSearch('');
          committed.current = '';
          onReset();
        }}
      >
        Reset
      </GoabButton>
    </SearchRow>
  );
};

const SearchRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--goa-space-s);

  > *:first-child {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;
