import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoABadge, GoATable } from '@abgov/react-components';
import { PageBorder, TocPageRef, TocStatus } from './styled-components';
import { CategoriesState, CategoryState } from './context';

export interface TocProps {
  categories: CategoriesState;
  onClick: (id: number) => void;
}

enum PageStatus {
  Complete = 'Completed',
  Incomplete = 'Incomplete',
  NotStarted = 'Not started',
}

const getPageStatus = (category: CategoryState): JSX.Element => {
  const status = category.isVisited
    ? category.isCompleted && category.isValid
      ? PageStatus.Complete
      : PageStatus.Incomplete
    : PageStatus.NotStarted;
  const badgeType = status === PageStatus.Complete ? 'success' : 'information';
  return <GoABadge type={badgeType} content={status} ariaLabel={status}></GoABadge>;
};

/* eslint-disable jsx-a11y/anchor-is-valid */
export const TableOfContents = (props: TocProps): JSX.Element => {
  const testid = 'table-of-contents';
  return (
    <PageBorder>
      <GoATable width="100%" data-testid={testid}>
        <tbody>
          {props.categories?.map((category, index) => {
            const pageStatus = getPageStatus(category);
            return (
              <tr>
                <TocPageRef>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      props.onClick(index);
                    }}
                  >
                    {category.label}
                  </a>
                </TocPageRef>
                <TocStatus>{getPageStatus(category)}</TocStatus>
              </tr>
            );
          })}
        </tbody>
      </GoATable>
    </PageBorder>
  );
};

export const TableOfContentsTester: RankedTester = rankWith(1, uiTypeIs('TaskSection'));

//export default withJsonFormsRendererProps(TableOfContents);
