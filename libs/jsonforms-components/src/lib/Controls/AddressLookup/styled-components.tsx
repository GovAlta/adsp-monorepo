import styled from 'styled-components';

interface ListItemProps {
  selectedIndex: number;
  index: number;
}

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
    overflow: hidden auto;
  }
  .suggestions li {
    padding: var(--goa-space-xs) var(--goa-space-2xs) var(--goa-space-xs) 2px;
    color: var(--color-gray-900);
  }
  .suggestion-active,
  .suggestions li:hover {
    background-color: var(--color-primary);
    color: var(--color-white);
    cursor: pointer;
    font-weight: var(--fw-bold);
  }
  .input-container {
    position: relative;
    display: inline-block;
    width: 100%; /* Ensures it spans the parent container */
  }

  .input-container .input-spinner {
    position: absolute;
    top: 50%;
    right: 8px; /* Adjust based on padding or margin of the input field */
    transform: translateY(-50%);
    z-index: 1; /* Ensure it appears above the input */
    pointer-events: none; /* Prevent spinner from interfering with clicks */
  }
`;

export const AddressIndent = styled.div`
  margin: 1em 1.5em 0 1.5em;
  textwrap: 'wrap';
  wordbreak: 'break-word';
`;

export const TextWrap = styled.p`
  text-wrap: auto;
  word-break: break-word;
`;

export const TextWrapDiv = styled.div`
  text-wrap: auto;
  word-break: break-word;
`;

export const LabelDiv = styled.div`
  font-size: var(--goa-font-size-2);
  padding-bottom: var(--goa-space-l);
`;

/* istanbul ignore next */
export const ListItem = styled.li<ListItemProps>`
  background-color: ${({ selectedIndex, index }) => (selectedIndex === index ? 'var(--color-primary)' : '')};
  color: ${({ selectedIndex, index }) => (selectedIndex === index ? 'var(--color-white) !important' : '')};
  font-weight: ${({ selectedIndex, index }) => (selectedIndex === index ? 'var(--fw-bold)' : '')};
`;
