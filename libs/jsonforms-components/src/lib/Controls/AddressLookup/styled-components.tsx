import styled from 'styled-components';

export const SearchBox = styled.div`
  position: relative;

  .suggestions {
    width: 100%;
    margin-top: 3px;
    border-top-width: 0;
    list-style: none;
    max-height: 15.5rem;
    width: 100%;
    position: absolute;

    background: var(--color-white);
    box-shadow: 0 8px 8px rgb(0 0 0 / 20%), 0 4px 4px rgb(0 0 0 / 10%);
    z-index: 99;
    padding-left: 0px;

    overflow: hidden auto;
  }
  .suggestions li {
    padding: 0.5rem;
    color: var(--color-gray-900);
  }
  .suggestion-active,
  .suggestions li:hover {
    background-color: var(--color-primary);
    color: var(--color-white);
    cursor: pointer;
    font-weight: var(--fw-bold);
  }
`;

export const LabelDiv = styled.div`
  font-size: var(--fs-sl);
  font-weight: var(--fw-bold);
  padding-bottom: 1.5rem;
`;