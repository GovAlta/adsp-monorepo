import styled from 'styled-components';
export const SearchBox = styled.div`
  position: relative;
  .search {
    display: flex;
    border: 1px solid var(--color-gray-700);
    border-radius: 3px;
    padding: 0.16rem;
  }
  .search-open {
    border: 1px solid var(--color-orange);
  }
  .goa-state--error .search {
    border: 1px solid var(--color-red);
  }
  input {
    border-width: 0;
    width: 100%;
  }
  input:focus {
    outline: none;
  }
  .suggestions {
    border: 1px solid var(--color-gray-700);
    border-top-width: 0;
    list-style: none;
    margin-top: 0;
    max-height: 15.5rem;
    width: 100%;
    position: absolute;

    background: var(--color-white);
    box-shadow:
      0 8px 8px rgb(0 0 0 / 20%),
      0 4px 4px rgb(0 0 0 / 10%);
    z-index: 99;
    padding-left: 0px;

    overflow: hidden auto;
  }
  .suggestions li {
    padding: 0.5rem;
    color: var(--color-gray-900);
  }

  .suggestions li:hover {
    background-color: var(--color-primary);
    color: var(--color-white);
    cursor: pointer;
    font-weight: var(--fw-bold);
  }
  .suggestions .suggestion-active {
    background-color: var(--color-primary);
    color: var(--color-white);
    font-weight: var(--fw-bold);
  }
`;

export const DateTimeInput = styled.input`
  display: flex;
  align-content: center;
  width: 100%;
  line-height: var(--input-height);
  height: var(--input-height);
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  > input {
    border: none;
  }
  :hover {
    border-color: var(--color-blue-600);
  }
  :active,
  :focus {
    border-color: #004f84;
    box-shadow: 0 0 0 3px #feba35;
    outline: none;
  }
`;
