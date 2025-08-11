import { GoAText } from '@abgov/react-components';
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
        <GoAText size="heading-m" mt="none" mb="m" ml="m">
          {section}
        </GoAText>
      </td>
    </SectionHeaderRowTr>
  );
};
