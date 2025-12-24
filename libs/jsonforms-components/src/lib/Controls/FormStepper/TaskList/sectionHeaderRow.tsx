import { GoabText } from '@abgov/react-components';
import { SectionHeaderRowTr } from '../styled-components';

interface SectionHeaderRowProps {
  title: string;
  index: number;
}

export const SectionHeaderRow = ({ title, index }: SectionHeaderRowProps): JSX.Element => {
  const section = `${index}. ${title}`;
  return (
    <SectionHeaderRowTr>
      <td colSpan={2}>
        <GoabText size="heading-m" mt="xl" mb="m">
          {section}
        </GoabText>
      </td>
    </SectionHeaderRowTr>
  );
};
