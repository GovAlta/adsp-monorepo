import styled from 'styled-components';

// *****************
// Styled Components
// *****************

export const TitleLinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export const TableStyle = styled.div`
  & .half-width {
    width: 50%;
  }
`;

export const Title = styled.h2`
  && {
    margin: 0;
  }
`;

export const NoItem = styled.div`
  text-align: left;
  padding-top: 1.5rem;
  padding-bottom: 0.5rem;
  font-weight: 700;
`;

export const NameDiv = styled.div`
  margin-top: 1rem;
  text-transform: capitalize;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;

export const TableDiv = styled.div`
  & td:last-child {
    text-align: center;
  }
`;
