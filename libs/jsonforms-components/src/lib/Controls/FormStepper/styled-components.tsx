import styled from 'styled-components';

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  border: var(--goa-border-width-s) solid grey;
  border-radius: var(--goa-border-radius-m);
  margin: var(--goa-space-2xs);
  padding: var(--goa-space-xs);
  div:empty {
    display: none;
  }
`;
export const ReviewItemSection = styled.div`
  background-color: #f1f1f1;
  margin-bottom: var(--goa-space-m);
  padding: var(--goa-space-m);
  border: 1px solid #dcdcdc;
  border-radius: 5px;

  .element-style {
    max-width: 1600px;
  }
`;
export const ReviewItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--goa-space-xl);
`;
export const ReviewItemTitle = styled.div`
  font-size: var(--goa-space-l);
  line-height: var(--goa-space-xl);
  font-weight: 300;
`;

export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;

  &:focus {
    outline: 2px solid #0070c4;
    background-color: #e6f7ff;
  }
`;

export const ReviewListItem = styled.div`
  margin-left: var(--goa-space-m);
`;

export const ReviewListWrapper = styled.div`
  margin-bottom: var(--goa-space-m);
`;
export const ListWithDetail = styled.div`
  margin: var(--goa-space-s);
  width: 100%;
`;
export const ListWithDetailHeading = styled.h3`
  text-transform: capitalize;
`;

export const RightAlignmentDiv = styled.div`
  @media screen and (max-width: 767px) {
    margin-bottom: var(--goa-space-l);
  }
  @media screen and (min-width: 768px) {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--goa-space-l);
  }
`;

export const FormStepperSummaryH3 = styled.h3`
  flex: 1;
  margin-bottom: var(--goa-space-m);
  font-size: var(--goa-font-size-7);
  line-height: var(--goa-line-height-4);
  font-weight: var(--goa-font-weight-regular);
`;
export const PageRenderPadding = styled.div`
  margin-top: var(--goa-space-2xl);
`;

export const PageRenderPaddingBottom = styled.div`
  margin-bottom: var(--goa-space-2xl);
`;

export const PageBorder = styled.h3`
  padding: var(--goa-space-3xl);
`;

export const TableReviewItemSection = styled.div`
  .element-style {
    max-width: 1600px;
  }
`;

export const TableReviewItem = styled.div`
  border: 1px solid #dcdcdc;
  border-radius: 5px;
  padding: var(--goa-space-2xl);
`;

export const TableReviewPageTitleRow = styled.div`
  margin-top: var(--goa-space-xl);
  display: flex;
  justify-content: space-between;
`;

export const TableReviewCategoryLabel = styled.h3`
  color: var(--goa-color-text-secondary) !important;
  margin-bottom: var(--goa-space-l);
`;

export const CategoryStatus = styled.td`
  width: var(--goa-space-xl);
  padding-right: var(--goa-space-xl);
`;
export const TocPageRef = styled.td`
  padding-left: var(--goa-space-xl);
`;

export const CompletionStatus = styled.div`
  padding: 0;
  margin: 0;
  padding-left: var(--goa-space-xl);
  padding-bottom: var(--goa-space-xl);
`;

interface PageStepperRowProps {
  disabled: boolean;
}

export const PageStepperRow = styled.tr<PageStepperRowProps>`
  ${({ disabled }) =>
    disabled
      ? `
           pointer-events: none;
           opacity: 0.5;
         `
      : `
           cursor: pointer;
         `}
`;

export const SectionHeaderRowTr = styled.tr`
  & > td {
    border: 0 !important;
    padding-top: var(--goa-space-l);
    padding-bottom: var(--goa-space-s);
  }

  & + tr > td {
    border-top: none !important;
  }
`;

export const SummaryRowLink = styled.a`
  position: relative;
  top: var(--goa-space-xs);
`;
