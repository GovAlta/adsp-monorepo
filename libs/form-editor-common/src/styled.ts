import styled from 'styled-components';

export const ModalContent = styled.div`
  background: var(--goa-color-greyscale-white);

  padding-top: 24px;
  // margin-top: -94px;
  // position: fixed; /* covers entire viewport */
  // top: 0;
  // left: 0;
  // width: 100%;
  // height: 100%;
  // z-index: 9999;
`;
export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  padding: var(--goa-space-m);
  text-align: left;

  p {
    font-size: var(--goa-font-size-1);

    margin-top: 0px;
    margin-bottom: 0px;

    li {
      margin-left: 12px;
    }
  }
`;
export const NameDiv = styled.div`
  margin-top: 1rem;
  font-size: var(--goa-font-size-7);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;

export const TableDiv = styled.div`
  & td:first-child {
    width: 120px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
  }
  & td:nth-child(2) {
    word-wrap: break-word;
    word-break: break-word;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: right;
  }
  & .group-name {
    font-size: var(--goa-font-size-5);
    font-weight: var(--goa-font-weight-bold);
  }

  & td:first-child {
    width: 100px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & .payload-details {
    div {
      background: #f3f3f3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: var(--goa-font-size-1);
      line-height: var(--goa-space-m);
      padding: var(--goa-space-m);
    }
    padding: 0;
  }

  table {
    margin-bottom: 2rem;
  }
`;

export const Buttons = styled.div`
  margin-bottom: 1rem;
  text-align: left;
`;

export const ActionIconsDiv = styled.div`
  width: 100%;
  min-width: var(--goa-space-3xl);
  display: flex;
  flex-direction: row;
  justify-content: center;
  goa-icon-button {
    margin: 0 4px;
  }
`;
