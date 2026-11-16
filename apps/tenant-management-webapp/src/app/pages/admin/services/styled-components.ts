import styled from 'styled-components';

export const ModalContent = styled.div`
  background: var(--goa-color-greyscale-white);
  margin-top: -24px;
  padding-top: 24px;
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

export const CatalogCard = styled.div`
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  margin-bottom: var(--goa-space-s);

  & .card-header {
    display: flex;
    align-items: center;
    gap: var(--goa-space-xs);
    width: 100%;
    padding: var(--goa-space-s) var(--goa-space-m);
    background: none;
    border: none;
    font: inherit;
    font-weight: var(--goa-font-weight-bold);
    text-align: left;
    cursor: pointer;
  }
  & .card-body {
    padding: 0 var(--goa-space-m) var(--goa-space-s);
  }
  & table {
    margin-bottom: 0;
    table-layout: fixed;
    width: 100%;
  }
  & th:nth-child(1) {
    width: 38%;
  }
  & th:nth-child(2) {
    width: 18%;
  }
  & th:nth-child(3) {
    width: 14%;
  }
  & th:nth-child(4) {
    width: 16%;
  }
  & td {
    overflow-wrap: anywhere;
  }
  & tr.action-row {
    cursor: pointer;
  }
  & tr.action-row:hover {
    background: var(--goa-color-greyscale-100);
  }
  & td.details-cell {
    white-space: normal;
    text-align: left;
  }
  & mark {
    background: var(--goa-color-warning-light);
    color: inherit;
    padding: 0;
  }
  & .match-description {
    color: var(--goa-color-text-secondary);
    font-size: var(--goa-font-size-2);
  }
  & .severity {
    display: inline-flex;
    align-items: center;
    gap: var(--goa-space-xs);
    min-width: 5.5rem;
    text-transform: capitalize;
  }
  & .severity::before {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--goa-color-greyscale-500);
  }
  & .severity-info::before {
    background: var(--goa-color-info-default);
  }
  & .severity-warning::before {
    background: var(--goa-color-warning-default);
  }
  & .severity-critical::before {
    background: var(--goa-color-emergency-default);
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

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 4px;
  }
`;
