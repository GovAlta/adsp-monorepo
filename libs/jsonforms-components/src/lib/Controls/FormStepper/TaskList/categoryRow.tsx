import React from 'react';
import { TocPageRef, CategoryStatus } from '../styled-components';
import { getCategoryStatusBadge } from '../CategoryStatus';
import { CategoryState } from '../context';
import { GoAText } from '@abgov/react-components';

interface CategoryRowProps {
  category: CategoryState;
  index: number;
  onClick: (id: number) => void;
}

/* eslint-disable jsx-a11y/anchor-is-valid */
export const CategoryRow: React.FC<CategoryRowProps> = ({ category, index, onClick }) => {
  return (
    <tr>
      <TocPageRef>
        <a
          data-testid={`page-ref-${index}`}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onClick(index);
          }}
        >
          <GoAText ml="l">{category.label}</GoAText>
        </a>
      </TocPageRef>
      <CategoryStatus>{getCategoryStatusBadge(category)}</CategoryStatus>
    </tr>
  );
};
