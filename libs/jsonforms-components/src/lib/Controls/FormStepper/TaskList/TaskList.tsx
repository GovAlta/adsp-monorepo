import React from 'react';
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

  const showInTaskListList = categories.map((cat) => {
    return cat?.uischema?.options?.showInTaskList || cat?.uischema?.options?.showInTaskList === undefined;
  });

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
            {sectioned.map(({ sectionTitle, categories: group }, index) => (
              <React.Fragment key={index}>
                {sectionTitle && showInTaskListList[globalIndex] && (
                  <SectionHeaderRow key={`section-${sectionTitle}`} title={sectionTitle} index={sectionIndex++} />
                )}
                {group.map((category, groupIndex) => {
                  //eslint-disable-next-line
                  const shouldShow = (cat: any) => cat?.uischema?.options?.showInTaskList !== false;

                  let leftIndex = groupIndex;
                  while (leftIndex > 0 && !shouldShow(group[leftIndex - 1])) {
                    leftIndex--;
                  }
                  let rightIndex = groupIndex;
                  while (rightIndex < group.length - 1 && !shouldShow(group[rightIndex + 1])) {
                    rightIndex++;
                  }
                  const currentLocalGroup = group.slice(leftIndex, rightIndex + 1);
                  const showGroupTaskListList = categories.map((cat) => shouldShow(cat));
                  const showCurrent = showInTaskListList[globalIndex];
                  const index = globalIndex++;
                  const modifyCategory = JSON.parse(JSON.stringify(category));
                  modifyCategory.isCompleted =
                    currentLocalGroup.length === currentLocalGroup.filter((category) => category.isCompleted).length;
                  let currentCategory = category;
                  if (showGroupTaskListList.length > showGroupTaskListList.filter((item) => item === true).length) {
                    currentCategory = modifyCategory;
                  }

                  if (showCurrent) {
                    return (
                      <CategoryRow
                        key={`cat-${category.label}-${index}`}
                        category={currentCategory}
                        index={index}
                        onClick={onClick}
                      />
                    );
                  }
                })}
              </React.Fragment>
            ))}

            <SummaryRow index={globalIndex} isValid={isValid} onClick={onClick} key="task-list-table-summary" />
          </tbody>
        </GoATable>
      </div>
    </PageBorder>
  );
};

export const TableOfContentsTester: RankedTester = rankWith(1, uiTypeIs('TaskSection'));
