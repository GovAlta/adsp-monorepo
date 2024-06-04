import { Aside } from '@components/Html';
import styled from 'styled-components';

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-top: 12px;
  }
`;

export const DashboardAside = styled(Aside)`
  padding-top: 1.6em;

  .copy-url {
    font - size: var(--fs-sm);
    background-color: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 1px;
    padding: 0.25rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    line-height: normal;
  }

  .small-font {
            font - size: var(--fs-sm);
    line-height: normal;
  }

  .mt-2 {
    margin - top: 2em;
  }
`;
export const DashboardDiv = styled.div`
  a {
    &:visited {
      color: var(--color-primary);
    }
  }
  margin-bottom: 2.5rem;

  .row {
    display: flex; /* equal height of the children */
  }

  .col {
    flex: 1; /* additionally, equal width */
  }

  .goa-container {
    height: 400px;
  }
`;

export const ListWrapper = styled.ul`
  list-style-type: value;
  margin-left: 1rem;
  li {
    margin-bottom: 0.5rem;
  }
`;
// 216 (GoAGrid min width) * 2 + 16 * 2 = 464
export const DashboardMinWidth = styled.div`
  min-width: 464px;
`;
