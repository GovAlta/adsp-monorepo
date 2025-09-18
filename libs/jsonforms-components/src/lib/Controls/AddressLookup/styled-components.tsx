import styled from 'styled-components';

interface ListItemProps {
  selected: number;
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

    background: var(--goa-color-greyscale-white);
    box-shadow: 0 8px 8px rgb(0 0 0 / 20%), 0 4px 4px rgb(0 0 0 / 10%);
    z-index: 99;
    overflow: hidden auto;
    padding-left: 0;
  }
  .suggestions li {
  }
  .suggestion-active,
  .suggestions li:hover {
    background-color: var(--goa-color-interactive-default);
    color: var(--goa-color-greyscale-white);
    cursor: pointer;
    font-weight: 600;
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
  margin: 0 0 var(--goa-space-m) 0;
  text-wrap: wrap;
  word-break: break-word;
  border: 1px solid var(--goa-color-greyscale-300);
  border-radius: var(--goa-border-radius-xl);
  padding: var(--goa-space-l);
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
  background-color: ${({ selected, index }) => (selected === index ? 'var(--goa-color-interactive-default)' : '')};
  color: ${({ selected, index }) => (selected === index ? 'var(--goa-color-greyscale-white) !important' : '')};
  font-weight: ${({ selected, index }) => (selected === index ? '600' : '')};
  padding: var(--goa-space-xs) var(--goa-space-2xs) var(--goa-space-xs) var(--goa-space-xs);
  margin-left: 0.25rem;
`;
