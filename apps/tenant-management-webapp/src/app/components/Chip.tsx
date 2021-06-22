import styled from 'styled-components';

export type ChipType = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

interface Props {
  type: ChipType
}

export const GoAChip = styled.div<Props>`
  display: inline-block;
  border-radius: 999px;
  padding: 0 0.5rem;
  color: ${(props) => `var(--color-notice-${props.type})`};
  border: 1px solid ${(props) => `var(--color-notice-${props.type})`};
  background-color: transparent;
  font-size: var(--fs-xs);
  line-height: 1.2rem;
  text-transform: uppercase;
  font-weight: var(--fw-bold);
`;

export default GoAChip;
