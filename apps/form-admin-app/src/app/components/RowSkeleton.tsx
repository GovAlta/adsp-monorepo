import { GoASkeleton } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';

interface RowSkeletonProps {
  columns: number;
  show: boolean;
}
export const RowSkeleton: FunctionComponent<RowSkeletonProps> = ({ columns, show }) => {
  return (
    show && (
      <tr>
        {Array(columns).fill(1).map((_, idx) => (
          <td key={idx}>
            <GoASkeleton type="text-small" />
          </td>
        ))}
      </tr>
    )
  );
};
