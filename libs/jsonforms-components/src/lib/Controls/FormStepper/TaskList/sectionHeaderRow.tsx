import { GoAText } from '@abgov/react-components';
import React from 'react';

interface SectionHeaderRowProps {
  title: string;
  index: number;
}

export const SectionHeaderRow: React.FC<SectionHeaderRowProps> = ({ title, index }) => {
  const section = `${index}. ${title}`;
  return (
    <tr>
      <td colSpan={2}>
        <GoAText size="heading-m" mt="none" mb="m" ml="m">
          {section}
        </GoAText>
      </td>
    </tr>
  );
};
