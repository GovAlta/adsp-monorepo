import styled from 'styled-components';

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  margin: var(--goa-space-2xs);
  padding: var(--goa-space-xs);
  padding-top: 0;
`;

export const ReviewItemSection = styled.div`
  background-color: #f1f1f1;
  margin: 0.5rem 0;
  padding: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
  overflow-x: auto;
`;

export const ReviewItemBasic = styled.div`
  background-color: #f1f1f1;
  padding: 1rem;
`;

export const ReviewItemTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--lh-lg);
  font-weight: var(--fw-light);
`;

export const ListWithDetail = styled.div`
  margin: var(--goa-space-s);
  width: 100%;
`;
export const ListWithDetailHeading = styled.h3`
  text-transform: capitalize;
`;

export const ReviewContent = styled.div`
  margin-top: var(--goa-space-l);
  overflow-y: auto;
  padding-bottom: 0;
  min-width: 624px;
  max-width: 100%;
  width: auto;
  margin: 0 auto;
`;

export const ActionContainer = styled.div`
  width: 100%;
  padding-top: var(--goa-space-l);
  background-color: #fff;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  & > form {
    margin: auto;
  }
  > :last-child {
    margin-left: auto;
  }
`;

export const FormReviewContainer = styled.div`
  background-color: rgb(241, 241, 241);
  padding: var(--goa-space-l) var(--goa-space-3xl);
  border: 1px solid rgb(220, 220, 220);
  border-radius: 5px;
  overflow: auto;
`;
