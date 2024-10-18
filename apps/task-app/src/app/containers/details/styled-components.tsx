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
`;

export const ReviewItemBasic = styled.div`
  background-color: #f1f1f1;
  padding: 1rem;
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

export const ReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items:center;
  padding-top: 24px !important;
  height: 100%;
  width:100%;
`;

export const ReviewContent = styled.div`
  margin-top: var(--goa-space-l);
  overflow-y: auto;
  padding-bottom: 0;
  max-width:624px;
  width:100%;
  margin: 0 auto;
`;

export const ActionContainer = styled.div`
  max-width:600px;
  width: 100%;
  flex-shrink: 0;
  background-color: #fff;
  gap: var(--goa-space-s);
`;

export const ActionControl = styled.div`
  padding-top: var(--goa-space-s);
`;
