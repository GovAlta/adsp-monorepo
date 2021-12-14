import styled from 'styled-components';

export const IconContext = styled.div`
  img.goa-icon {
    :hover {
      background: var(--color-gray-200);
    }
    :active {
      border: 3px solid var(--color-active-orange);
      border-radius: 4px;
    }
    :focus {
      border: 3px solid var(--color-active-orange);
      border-radius: 4px;
    }
  }
}`