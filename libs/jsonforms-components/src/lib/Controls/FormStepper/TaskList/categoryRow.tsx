import React from 'react';
import { CategoryStatus, PageStepperRow } from '../styled-components';
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
  return category.visible ? (
    <PageStepperRow
      disabled={!category?.isEnabled}
      role="button"
      key={`task-list-${index}-stepper-row`}
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        if (category?.isEnabled) onClick(index);
      }}
      onKeyDown={(e) => e.key === 'Enter' && onClick(index)}
      data-testid={`page-ref-${index}`}
    >
      <td key={`task-list-${index}-stepper-row-label`}>{category.label}</td>
      <CategoryStatus>{getCategoryStatusBadge(category)}</CategoryStatus>
    </PageStepperRow>
  ) : null;
};
