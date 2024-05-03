import styled from 'styled-components';

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
  border: var(--goa-border-width-s) solid grey;
  border-radius: var(--goa-border-radius-m);
  margin: var(--goa-space-2xs);
  margin-top: var(--goa-space-m);
  padding: var(--goa-space-xs);
`;
export const ReviewItemSection = styled.div`
  background-color: #f1f1f1;
  margin: 0.5rem 0;
  padding: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
`;
export const ReviewItemBasic = styled.div`
  background-color: #f1f1f1;

  padding: 1rem;
`;
export const ReviewItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;
export const ReviewItemTitle = styled.div`
  font-size: var(--fs-xl);
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
