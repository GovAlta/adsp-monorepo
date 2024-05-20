import styled from 'styled-components';

export const PRE = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-line-height-05);
  padding: var(--goa-space-m);
  margin-top: var(--goa-space-s);
`;

export const UrlWrapper = styled.div`
  display: flex;
  width: 100%;
`;
export const DropdownWrapper = styled.div`
  width: 120px;
`;
export const FeedbackOverviewSection = styled.div`
  p {
    line-height: 28px;
  }
`;
export const modelSpacingWrapper = styled.div`
  padding: 4px, 0px, 0px, 0px;
`;
export const FeedbackSubHeading = styled.div`
  font: var(--goa-typography-heading-s);
  margin-top: var(--goa-space-m);
  margin-bottom: var(--goa-space-xs);
`;
export const TableDiv = styled.div`
  .noPadding {
    padding: 0;
  }
  word-wrap: break-word;
  div {
    line-height: 28px;
    font-weight: 400;
  }
  small {
    font-weight: 400;
    line-height: 20px;
    padding-top: 18px;
  }
`;
export const CheckboxSpaceWrapper = styled.div`
  display: flex;
  margin-left: var(--goa-space-3xs);
  margin-top: var(--goa-space-l);
`;
export const HelpText = styled.div`
  font: var(--goa-typography-body-xs);
  display: flex;
  display-direction: row;
  justify-content: space-between;
  padding-left: var(--goa-space-xl);
`;
export const DeleteGap = styled.div`
  column-gap: 40px;
  padding-bottom: var(--goa-space-s);
`;

export const Buttons = styled.div`
  margin-top: var(--goa-space-xs);
  margin-bottom: var(--goa-space-2xl);
  text-align: left;
`;
export const Heading = styled.div`
  font: var(--goa-typography-heading-m);
  margin-bottom: var(--goa-space-m);
`;
