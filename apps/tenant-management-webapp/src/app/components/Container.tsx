import styled from 'styled-components';

interface Props {
  // base vertical spacing
  vs?: number;
  // base horizontal spacing
  hs?: number;

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
  padding: ${(props) => `${props.vs ?? 0}rem ${props.hs ?? 0}rem`};

  @media (min-width: 1280px) {
    margin-left: 0%;
    margin-right: 0%;
    width: auto;
  }

  @media (min-width: 1440px) {
    margin-left: 4%;
    margin-right: 2%;
  }

  @media (min-width: 1600px) {
    margin-left: 7%;
    margin-right: 3%;
  }

  @media (min-width: 1960px) {
    margin-left: 15%;
    margin-right: 7%;
  }

  @media (min-width: 2400px) {
    margin-left: 20%;
    margin-right: 12%;
  }
`;

export const MainColumnContainer = styled.div`
  width: 100%;
  padding: var(--goa-space-xl);
`;

export default Container;
