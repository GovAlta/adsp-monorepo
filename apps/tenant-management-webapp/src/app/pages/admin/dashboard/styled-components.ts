import { Aside } from '@components/Html';
import styled from 'styled-components';

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 8px;
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
`;

export const ListWrapper = styled.ul`
  list-style-type: value;
  margin-left: 1rem;
  li {
    margin-bottom: 0.5rem;
  }
`;
export const LinkCopyComponentWrapper = styled.div`
  position: relative;
  padding-top: 1.5rem;
`;

export const CopyLinkToolTipWrapper = styled.div`
  .checkmark-icon {
    display: inline-block;
    margin-top: 0.5rem;
    margin-left: 0.5rem;
  }
  .message {
    font-size: 0.875rem;
    display: inline;
    position: absolute;
    top: 0.3rem;
    left: 2rem;
  }
  .URL-tooltip {
    width: 30rem !important;
    left: -5.5rem;
    font-size: 10px;
  }
  p {
    position: absolute;
    background: var(--color-gray-100);
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    border-radius: 30px;
    width: 12rem;
    height: 2.2rem;
    top: -1.5rem;
    left: 1rem;
  }

  p:before {
    content: '';
    position: absolute;
    top: 2rem;
    left: 6rem;
    z-index: 1;
    border: solid 15px transparent;
    border-right-color: var(--color-gray-100);
    border-top: 15px solid var(--color-gray-100);
    border-right: 10px solid transparent;
    border-left: 10px solid transparent;
    border-bottom: none;
  }
`;
