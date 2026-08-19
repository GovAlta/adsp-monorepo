import { GoabCallout } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { DATA_VALUE_SORT_MAX_RESULTS } from '../state';

interface DataValueSortNoticeProps {
  total: number;
  columnCount: number;
}

export const DATA_VALUE_SORT_NOTICE_ID = 'data-value-sort-notice';

export const isDataValueSortAvailable = (total: number): boolean =>
  typeof total !== 'number' || total <= DATA_VALUE_SORT_MAX_RESULTS;

// Form data columns can only be sorted over a result set small enough to load in full, so when there
// are too many results their headings are not sort controls. Nothing on the heading itself can say
// why, so the reason and the way to resolve it are stated next to the filters that resolve it.
export const DataValueSortNotice: FunctionComponent<DataValueSortNoticeProps> = ({ total, columnCount }) => {
  if (!columnCount || isDataValueSortAvailable(total)) {
    return null;
  }

  return (
    <div id={DATA_VALUE_SORT_NOTICE_ID} data-testid={DATA_VALUE_SORT_NOTICE_ID}>
      <GoabCallout type="information" size="medium" mb="m">
        {total} results. Sorting by form data columns is available under {DATA_VALUE_SORT_MAX_RESULTS} results; narrow
        your filters to sort by those columns.
      </GoabCallout>
    </div>
  );
};
