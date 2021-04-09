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
`;

export default Container;
