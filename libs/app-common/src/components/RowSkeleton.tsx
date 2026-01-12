import { GoabSkeleton } from '@abgov/react-components';
import { FunctionComponent } from 'react';

interface RowSkeletonProps {
  columns: number;
  show: boolean;
}
export const RowSkeleton: FunctionComponent<RowSkeletonProps> = ({ columns, show }) => {
  return (
    show && (
      <tr>
        {Array(columns)
          .fill(1)
          .map((_, idx) => (
            <td key={idx}>
              <GoabSkeleton type="text-small" />
            </td>
          ))}
      </tr>
    )
  );
};
