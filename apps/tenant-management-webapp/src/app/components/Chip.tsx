import styled from 'styled-components';

const colors = {
  primary: '#2F70FF',
  secondary: '#444',
  success: '#308752',
  warning: '#F9C000',
  danger: '#D33242',
};

interface Props {
  type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const GoAChip = styled.div<Props>`
  border-radius: 999px;
  padding: 0 0.5rem;
  color: ${(props) => colors[props.type]};
  border: 1px solid ${(props) => colors[props.type]};
  background-color: transparent;
  font-size: var(--fs-xs);
  line-height: 1.2rem;
  text-transform: uppercase;
  font-weight: var(--fw-bold);
`;

export default GoAChip;
