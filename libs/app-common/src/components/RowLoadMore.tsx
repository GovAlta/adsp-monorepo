import { GoabButton, GoabButtonGroup } from '@abgov/react-components';
import { FunctionComponent } from 'react';

interface RowLoadMoreProps {
  next?: string;
  columns: number;
  loading: boolean;
  onLoadMore: (after: string) => void;
}

export const RowLoadMore: FunctionComponent<RowLoadMoreProps> = ({ next, columns, loading, onLoadMore }) => {
  return (
    next && (
      <tr>
        <td colSpan={columns}>
          <GoabButtonGroup alignment="center">
            <GoabButton size="compact" type="text" disabled={loading} onClick={() => onLoadMore(next)}>
              Load more
            </GoabButton>
          </GoabButtonGroup>
        </td>
      </tr>
    )
  );
};
