import styled from 'styled-components';

export const ReviewItem = styled.div`
  display: flex;
  flex-direction: column;
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
  height: 100%;
  padding-top: 0;
`;

export interface ReviewContentProps {
  paddingBottom: string;
}

export const ReviewContent = styled.div<ReviewContentProps>`
  flex: 1;
  overflow-y: auto;
  padding-bottom: ${(props) => props.paddingBottom || '0'};
`;

export const ActionContainer = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
  margin-left: var(--goa-space-s);
`;

export const ActionControl = styled.div``;
