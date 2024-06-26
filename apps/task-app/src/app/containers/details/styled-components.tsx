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

export const FormDispositionDetail = styled.div`
  margin: var(--goa-space-s);
  display: flex;
  flex-direction: column;
`;

export const ReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export interface ReviewContentProps {
  paddingBottom: string;
}

export const ReviewContent = styled.div<ReviewContentProps>`
  flex: 1;
  overflow-y: auto;
  padding-bottom: ${(props) => props.paddingBottom || '60px'};
`;

export const ActionContainer = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #fff;
  padding: 10px 0;
  display: flex;
  gap: 10px;
`;
