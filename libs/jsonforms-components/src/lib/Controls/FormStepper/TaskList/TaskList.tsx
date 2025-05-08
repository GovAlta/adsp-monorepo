import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoATable, GoAText } from '@abgov/react-components';
import { PageBorder } from '../styled-components';
import { CategoriesState } from '../context';
import { ApplicationStatus } from '../ApplicationStatus';
import { getCategorySections } from './categorySections';
import { SectionHeaderRow } from './sectionHeaderRow';
import { CategoryRow } from './categoryRow';
import { SummaryRow } from './summaryRow';

export interface TocProps {
  categories: CategoriesState;
  onClick: (id: number) => void;
  title?: string;
  subtitle?: string;
  isValid: boolean;
}

/* eslint-disable jsx-a11y/anchor-is-valid */
export const TaskList = ({ categories, onClick, title, subtitle, isValid }: TocProps): JSX.Element => {
  const testid = 'table-of-contents';
  const sectioned = getCategorySections(categories);

  let globalIndex = 0;
  let sectionIndex = 1;

  return (
    <PageBorder>
      <div data-testid={testid}>
        {title && (
          <GoAText size="heading-xl" ml="xl" mb="xl">
            {title}
          </GoAText>
        )}
        <ApplicationStatus />
        {subtitle && (
          <GoAText size="heading-l" mt="none" mb="xl" ml="xl">
            {subtitle}
          </GoAText>
        )}

        <GoATable width="100%">
          <tbody>
            {sectioned.map(({ sectionTitle, categories: group }) => (
              <>
                {sectionTitle && (
                  <SectionHeaderRow key={`section-${sectionTitle}`} title={sectionTitle} index={sectionIndex++} />
                )}
                {group.map((category) => {
                  const index = globalIndex++;
                  return (
                    <CategoryRow key={`cat-${category.label}`} category={category} index={index} onClick={onClick} />
                  );
                })}
              </>
            ))}

            <SummaryRow index={globalIndex} isValid={isValid} onClick={onClick} />
          </tbody>
        </GoATable>
      </div>
    </PageBorder>
  );
};

export const TableOfContentsTester: RankedTester = rankWith(1, uiTypeIs('TaskSection'));
