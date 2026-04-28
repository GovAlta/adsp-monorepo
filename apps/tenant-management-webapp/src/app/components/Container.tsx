import styled from 'styled-components';

interface Props {
  // base vertical spacing
  vs?: number;
  // base horizontal spacing
  hs?: number;

  backgroundColor?: string;

  // spacing overrides for different screen sizes
  smVSpacing?: number;
  smHSpacing?: number;
  mdVSpacing?: number;
  mdHSpacing?: number;
  lgVSpacing?: number;
  lgHSpacing?: number;
  xlVSpacing?: number;
  xlHSpacing?: number;
}

const Container = styled.div<Props>`
  width: 100%;
  margin: 0 auto;
  background-color: ${(props) => props.backgroundColor ?? 'transparent'};
  padding: ${(props) => `${props.vs ?? 0}rem ${props.hs ?? 0}rem`};
`;

export default Container;
