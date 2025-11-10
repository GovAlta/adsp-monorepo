import React, { useState, useEffect } from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoATable, GoAText } from '@abgov/react-components';
import { PageBorder } from '../styled-components';
import { CategoriesState } from '../context';
import { ApplicationStatus } from '../ApplicationStatus';
import { getCategorySections } from './categorySections';
import { SectionHeaderRow } from './sectionHeaderRow';
import { CategoryRow } from './categoryRow';
import { SummaryRow } from './summaryRow';
import { getCategoryStatus } from '../CategoryStatus';
import { SectionMap } from './categorySections';
import { CategoryState } from '../context';

export interface TocProps {
  categories: CategoriesState;
  onClick: (id: number) => void;
  title?: string;
  subtitle?: string;
  isValid: boolean;
}

function mergeOrphanSections(sections: SectionMap[]) {
  const result = [];
  for (const section of sections) {
    const hasValidTitle = section.sectionTitle && section.sectionTitle.trim() !== '';
    if (hasValidTitle) {
      result.push({ ...section, categories: [...section.categories] });
    } else {
      if (result.length > 0) {
        result[result.length - 1].categories.push(...section.categories);
      } else {
        result.push({ sectionTitle: '', categories: [...section.categories] });
      }
    }
  }
  return result;
}

function expandSections(inputArray: SectionMap[]) {
  if (!inputArray || inputArray.length === 0) return [];
  const originalSection = inputArray[0];
  const categories = originalSection.categories || [];
  return categories.map((category, index) => ({
    sectionTitle: `${category.label} Section`,
    categories: [category]
  }));
}

/* eslint-disable jsx-a11y/anchor-is-valid */
export const TaskList = ({ categories, onClick, title, subtitle, isValid }: TocProps): JSX.Element => {
  const testid = 'table-of-contents';
  const sectioned = getCategorySections(categories);
  const [completedGroups, setCompletedGroups] = useState(0);
  const [total, setTotal] = useState(sectioned.filter((s) => s.categories && s.sectionTitle).length);

  const shouldShow = (cat: CategoryState) => cat?.uischema?.options?.showInTaskList !== false;

  const updateCompletion = (group: CategoryState[], category: CategoryState, groupIndex: number) : CategoryState => {
    let leftIndex = groupIndex;
    while (leftIndex > 0 && !shouldShow(group[leftIndex - 1])) {
      leftIndex--;
    }
    let rightIndex = groupIndex;
    while (rightIndex < group.length - 1 && !shouldShow(group[rightIndex + 1])) {
      rightIndex++;
    }
    const currentLocalGroup = group.slice(leftIndex, rightIndex + 1);
    const modifyCategory = JSON.parse(JSON.stringify(category));
    modifyCategory.isCompleted = currentLocalGroup.length === currentLocalGroup.filter((cat) => cat.isCompleted).length;
    return modifyCategory;
  }

  const showInTaskListList = categories.map((cat) => {
    return cat?.uischema?.options?.showInTaskList || cat?.uischema?.options?.showInTaskList === undefined;
  });

  let globalIndex = 0;
  let sectionIndex = 1;

  useEffect(() => {
    let count = 0;
    let mergedSections = mergeOrphanSections(sectioned) as SectionMap[];
    if (mergedSections.length === 1) {
      mergedSections = expandSections(mergedSections);
      setTotal(mergedSections.length)
    }

    mergedSections.forEach(({ categories: group }) => {
      let countInGroup = 0;

      group.forEach((category, groupIndex) => {
        const modifyCategory = updateCompletion(group, category, groupIndex);;
        if (getCategoryStatus(modifyCategory) === 'Completed') {
          countInGroup++;
        }
      });

      if (countInGroup === group.length) {
        count++;
      }
    });

    setCompletedGroups(count);
  }, [categories, sectioned]); // re-run whenever categories change

  return (
    <PageBorder>
      <div data-testid={testid}>
        {title && (
          <GoAText size="heading-xl" ml="xl" mb="xl">
            {title}
          </GoAText>
        )}
        {subtitle && (
          <GoAText size="heading-l" mt="none" mb="xl" ml="xl">
            {subtitle}
          </GoAText>
        )}
        <ApplicationStatus
          completedGroups={completedGroups}
          totalGroups={total}
        />

        <GoATable width="100%">
          <tbody>
            {sectioned.map(({ sectionTitle, categories: group }, index) => (
              <React.Fragment key={index}>
             
                {sectionTitle && showInTaskListList[globalIndex] && (
                  <SectionHeaderRow key={`section-${sectionTitle}`} title={sectionTitle} index={sectionIndex++} />
                )}
                {group.map((category, groupIndex) => {
                  const showCurrent = showInTaskListList[globalIndex];      
                  const idx = globalIndex++; // renamed from `index` to avoid shadowing

                  let currentCategory = category;
                  const modifyCategory = updateCompletion(group, category, groupIndex);

                   const showGroupTaskListList = categories.map((cat) => shouldShow(cat));
                   if (showGroupTaskListList.length > showGroupTaskListList.filter((item) => item === true).length) {
                     currentCategory = modifyCategory;
                   }

                  if (showCurrent) {
                    return (
                      <CategoryRow
                        key={`cat-${category.label}-${idx}`}
                        category={currentCategory}
                        index={idx}
                        onClick={onClick}
                      />
                    );
                  }

                  return null;
                })}
              </React.Fragment>
            ))}

            <SummaryRow index={globalIndex} isValid={isValid} onClick={onClick} key="task-list-table-summary" />
          </tbody>
        </GoATable>
      </div>
    </PageBorder>
  );
};;

export const TableOfContentsTester: RankedTester = rankWith(1, uiTypeIs('TaskSection'));
