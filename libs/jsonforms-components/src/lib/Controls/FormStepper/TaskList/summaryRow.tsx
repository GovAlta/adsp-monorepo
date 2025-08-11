import React from 'react';
import { TocPageRef, CategoryStatus } from '../styled-components';
import { GoAText } from '@abgov/react-components';

interface SummaryRowProps {
  index: number;
  isValid: boolean;
  onClick: (id: number) => void;
}

/* eslint-disable jsx-a11y/anchor-is-valid */
export const SummaryRow: React.FC<SummaryRowProps> = ({ index, isValid, onClick }) => {
  return (
    <tr>
      <GoAText size="heading-m" mt="none" mb="xl" ml="xl">
        <a
          data-testid={`page-ref-${index}`}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onClick(index);
          }}
        >
          Summary
        </a>
      </GoAText>
    </tr>
  );
};
