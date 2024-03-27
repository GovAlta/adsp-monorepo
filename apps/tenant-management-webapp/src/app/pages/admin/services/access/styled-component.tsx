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

export const ServiceRoleListContainer = styled.div`
  margin-bottom: 1.5rem;
  .title {
    font-weight: 700;
    font-size: var(--fs-lg);
  }
`;

export const NoServiceRole = styled.div`
  font-weight: 700;
  margin-top: 1rem;
  margin-left: 0.5rem;
`;

export const TableDiv = styled.div`
  & td:first-child {
    width: 30%;
  }

  & td:nth-child(2) {
    width: 40%;
  }

  & td:nth-child(3) {
    width: 20%;
    text-align: center;
  }

  & td:last-child {
    width: 10%;
  }

  & th:first-child {
    width: 30%;
  }

  & th:nth-child(2) {
    width: 40%;
  }

  & td:nth-child(3) {
    width: 20%;
    text-align: center;
  }

  & td:last-child {
    width: 10%;
  }
`;

export const LoadingIndicatorContainer = styled.div`
  position: relative;
  top: -2.5rem;
  left: -3.5rem;
`;
