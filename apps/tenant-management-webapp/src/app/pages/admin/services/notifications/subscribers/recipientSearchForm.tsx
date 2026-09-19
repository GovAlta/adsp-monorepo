import React, { FunctionComponent } from 'react';
import { NotificationSearchForm, SEARCH_DEBOUNCE_MS } from '../notificationSearchForm';

export { SEARCH_DEBOUNCE_MS };

interface RecipientSearchFormProps {
  searchValue: string;
  onSearch: (search: string) => void;
  onReset: () => void;
}

// The registry searches one value against every field a recipient holds an address in. The
// subscriptions tab searches those fields separately, and keeps its own form for that.
export const RecipientSearchForm: FunctionComponent<RecipientSearchFormProps> = ({
  searchValue,
  onSearch,
  onReset,
}) => (
  <NotificationSearchForm
    searchValue={searchValue}
    onSearch={onSearch}
    onReset={onReset}
    inputTestId="recipient-search-input"
    resetButtonTestId="recipient-search-reset-button"
    ariaLabel="Search recipients by name, email or phone"
    placeholder="Search by name, email or phone..."
  />
);
