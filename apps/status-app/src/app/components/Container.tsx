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

const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: ${(props: Props) => `${props.vs ?? 0}rem ${props.hs ?? 0}rem`};

  @media (min-width: 640px) {
    margin: 0 auto;
    padding: ${(props: Props) => `${props.smVSpacing ?? props.vs ?? 0}rem ${props.smHSpacing ?? props.hs ?? 0}rem`};
    width: 640px;
  }
  @media (min-width: 768px) {
    margin: 0 auto;
    padding: ${(props: Props) => `${props.mdVSpacing ?? props.vs ?? 0}rem ${props.mdHSpacing ?? props.hs ?? 0}rem`};
    width: 768px;
  }
  @media (min-width: 1024px) {
    padding: ${(props: Props) => `${props.lgVSpacing ?? props.vs ?? 0}rem ${props.lgHSpacing ?? props.hs ?? 0}rem`};
    margin: 0 auto;
    width: 1024px;
  }
  @media (min-width: 1280px) {
    padding: ${(props: Props) => `${props.xlVSpacing ?? props.vs ?? 0}rem ${props.xlHSpacing ?? props.hs ?? 0}rem`};
    margin: 0 auto;
    width: 1280px;
  }
`;

export default Container;
