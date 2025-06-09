import { GoAText } from '@abgov/react-components';

interface SectionHeaderRowProps {
  title: string;
  index: number;
}

export const SectionHeaderRow = ({ title, index }: SectionHeaderRowProps): JSX.Element => {
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
