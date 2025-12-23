import React, { useMemo } from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoATable, GoAText } from '@abgov/react-components';
import { PageBorder } from '../styled-components';
import { CategoriesState, CategoryState } from '../context';
import { ApplicationStatus } from '../ApplicationStatus';
import { getCategorySections, SectionMap } from './categorySections';
import { SectionHeaderRow } from './sectionHeaderRow';
import { CategoryRow } from './categoryRow';
import { SummaryRow } from './summaryRow';

export interface TocProps {
  categories: CategoriesState;
  onClick: (id: number) => void;
  title?: string;
  subtitle?: string;
  isValid: boolean;
  hideSummary: boolean;
}

function mergeOrphanSections(sections: SectionMap[]): SectionMap[] {
  const result: SectionMap[] = [];
  for (const section of sections) {
    const hasValidTitle = section.sectionTitle?.trim() !== '';
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

const shouldShow = (cat: CategoryState) => cat?.uischema?.options?.showInTaskList !== false;

const isInTaskList = (cat: CategoryState) => cat?.uischema?.options?.showInTaskList !== false;

function updateCompletion(group: CategoryState[], index: number): CategoryState {
  const category = group[index];

  if (!isInTaskList(category)) return category;

  let endIndex = index;
  while (endIndex + 1 < group.length && !isInTaskList(group[endIndex + 1])) {
    endIndex++;
  }

  const relevant = group.slice(index, endIndex + 1);

  // A task is "completed" iff:
  // - the main row itself isCompleted, AND
  // - every detail page that is currently visible is also completed.

  const newIsCompleted = category.isCompleted && relevant.every((cat) => !cat.visible || cat.isCompleted);

  // If nothing changed, keep the same reference
  if (category.isCompleted === newIsCompleted) {
    return category;
  }

  // Otherwise, update the flag (and optionally keep status in sync)
  return {
    ...category,
    isCompleted: newIsCompleted,
    isValid: newIsCompleted ? category.isValid : false,
  };
}

export const TaskList: React.FC<TocProps> = ({ categories, onClick, title, subtitle, isValid, hideSummary }) => {
  const testid = 'table-of-contents';

  // Merge and expand sections
  const mergedSections = useMemo(() => {
    const sections = mergeOrphanSections(getCategorySections(categories));
    return sections;
  }, [categories]);

  const totalPages = useMemo(
    () => mergedSections.reduce((count, section) => count + section.categories.filter(shouldShow).length, 0),
    [mergedSections]
  );

  const completedPages = useMemo(
    () =>
      mergedSections.reduce(
        (count, section) => count + section.categories.filter((cat) => shouldShow(cat) && cat.isCompleted).length,
        0
      ),
    [mergedSections]
  );

  let globalIndex = 0;
  let sectionIndex = 1;

  return (
    <PageBorder>
      <div data-testid={testid}>
        {title && (
          <GoAText size="heading-xl" mb="xl">
            {title}
          </GoAText>
        )}
        {subtitle && (
          <GoAText size="heading-l" mt="none" mb="xl">
            {subtitle}
          </GoAText>
        )}
        <ApplicationStatus completedGroups={completedPages} totalGroups={totalPages} />

        <GoATable width="100%">
          <tbody>
            {mergedSections.map(({ sectionTitle, categories: group }, index) => (
              <React.Fragment key={index}>
                {sectionTitle && group.some(shouldShow) && (
                  <SectionHeaderRow key={`section-${sectionTitle}`} title={sectionTitle} index={sectionIndex++} />
                )}
                {group.map((category, groupIndex) => {
                  const showCurrent = shouldShow(category);
                  const idx = globalIndex++;

                  const currentCategory = showCurrent ? updateCompletion(group, groupIndex) : category;

                  return showCurrent ? (
                    <CategoryRow
                      key={`cat-${category.label}-${idx}`}
                      category={currentCategory}
                      index={idx}
                      onClick={onClick}
                    />
                  ) : null;
                })}
              </React.Fragment>
            ))}
            {!hideSummary ? (
              <SummaryRow index={globalIndex} isValid={isValid} onClick={onClick} key="task-list-table-summary" />
            ) : null}
          </tbody>
        </GoATable>
      </div>
    </PageBorder>
  );
};

export const TableOfContentsTester: RankedTester = rankWith(1, uiTypeIs('TaskSection'));
