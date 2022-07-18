import styled from 'styled-components';

export const StreamsDropdown = styled.div`
  margin-bottom: 1rem;
  margin-top: 1rem;
  width: 500px;
`;

export const StreamHeading = styled.div`
  margin-bottom: 1rem;
  font-weight: var(--fw-bold);
`;

export const Divider = styled.div`
  width: 10px;
  height: auto;
  display: inline-block;
`;

export const IndicatorDiv = styled.div`
  width: 12px;
  height: 12px;
  background: ${(props) => props.color};
  border-radius: 100%;
`;
