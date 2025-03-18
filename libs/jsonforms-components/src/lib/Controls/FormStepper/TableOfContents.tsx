import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoATable } from '@abgov/react-components';
import { PageBorder, TocTitle, TocPageRef, CategoryStatus, TocSubtitle } from './styled-components';
import { CategoriesState } from './context';
import { ApplicationStatus } from './ApplicationStatus';
import { getCategoryStatusBadge } from './CategoryStatus';

export interface TocProps {
  categories: CategoriesState;
  onClick: (id: number) => void;
  title: string | undefined;
  subtitle: string | undefined;
}

/* eslint-disable jsx-a11y/anchor-is-valid */
export const TableOfContents = (props: TocProps): JSX.Element => {
  const testid = 'table-of-contents';
  return (
    <PageBorder>
      <div data-testid={testid}>
        {props.title && <TocTitle>{props.title}</TocTitle>}
        <ApplicationStatus categories={props.categories}></ApplicationStatus>
        {props.subtitle && <TocSubtitle>{props.subtitle}</TocSubtitle>}
        <GoATable width="100%">
          <tbody>
            {props.categories?.map((category, index) => {
              return (
                <tr>
                  <TocPageRef>
                    <a
                      data-testid={`page-ref-${index}`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        props.onClick(index);
                      }}
                    >
                      {category.label}
                    </a>
                  </TocPageRef>
                  <CategoryStatus>{getCategoryStatusBadge(category)}</CategoryStatus>
                </tr>
              );
            })}
          </tbody>
        </GoATable>
      </div>
    </PageBorder>
  );
};

export const TableOfContentsTester: RankedTester = rankWith(1, uiTypeIs('TaskSection'));

//export default withJsonFormsRendererProps(TableOfContents);
