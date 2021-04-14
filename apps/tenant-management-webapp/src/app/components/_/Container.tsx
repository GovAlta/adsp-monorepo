import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem 1rem;
  width: 100%;

  @media (min-width: 768px) {
    margin: 0 auto;
    width: calc(768px - 2rem);
  }
  @media (min-width: 1024px) {
    margin: 0 auto;
    width: calc(1024px - 4rem);
  }

  h2 {
    font: var(--unnamed-font-style-normal) normal var(--unnamed-font-weight-bold) var(--unnamed-font-size-48) /
      var(--unnamed-line-spacing-56) var(--unnamed-font-family-acumin-pro-semicondensed);
    color: #333333;
    font-size: 48px;
    font-weight: bold;
  }

  h3 {
    font: var(--unnamed-font-style-normal) normal var(--unnamed-font-weight-bold) var(--unnamed-font-size-48) /
      var(--unnamed-line-spacing-56) var(--unnamed-font-family-acumin-pro-semicondensed);
    color: #333333;
    font-size: 24px;
  }
`;

export default Container;
