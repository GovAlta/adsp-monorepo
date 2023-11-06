import styled, { createGlobalStyle } from 'styled-components';

export const IdField = styled.div`
  min-height: 2.1rem;
`;

export const TableDiv = styled.div`
  word-wrap: break-word;
  table-layout: fixed;
  & th:nth-child(3) {
    min-width: 160px;
  }

  & td:nth-child(3) {
    min-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
export const UseServiceAccountWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 4px;
  }
`;
export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden` : `auto`)};
  }
`;
export const Modal = styled.div<{ open: boolean }>`
  display: ${(props) => (props.open ? `block` : `none`)};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 10000;
  width: 100%;
`;
export const ModalContent = styled.div`
  background: white;
`;
export const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;
export const MonacoDivBody = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  min-height: 65px;
  height: calc(72vh - 310px);
  margin-bottom: 1rem;
`;
export const TestInputDivBody = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  min-height: 65px;
  height: calc(57vh - 310px);
  margin-top: -1.5rem;
`;
export const ScriptPanelContainer = styled.div`
  display: flex;
  flex: auto;
  padding-left: 2rem;
  padding-right: 2rem;
  height: 100vh;
  margin-top: 90px;
  overflow: hidden;
  box-sizing: border-box;
`;
export const EditScriptActions = styled.div`
  display: flex;
  justify-content: left;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #adadad;
`;

export const ScriptEditorContainer = styled.div`
  width: 50%;
  padding-right: 1rem;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }

  @media (min-width: 1279px) {
    .mobile {
      display: none;
    }
  }

  @media (max-width: 1280px) {
    .desktop {
      display: none;
    }

    .mobile > div {
      padding: 2px 0 2px 3px;
    }
  }
`;
export const EditModalStyle = styled.div`
  width: 100%;
  display: flex;
  padding-top: 2rem;
  .half-width {
    width: 50%;
    display: flex;
    height: 100%;
  }

  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .flex-one {
    flex: 1;
  }

  .full-height {
    height: 100%;
  }

  .flex {
    display: flex;
  }

  .mt-2 {
    padding-top: 10px;
  }

  .execute-button {
    margin: 0 0 10px 10px;
    display: flex;
    justify-content: right;
  }

  .pt-1 {
    padding-top: 2px;
  }
  .responseLabel {
    display: block;
    font-weight: bold;
    color: #333;
    font-size: var(--fs-base);
    line-height: calc(var(--fs-base) + 1rem);
  }

  .hr-resize {
    margin-top: var(--goa-spacing-s);
  }
`;

export const SpinnerPadding = styled.div`
  float: right;
  padding: 3px 0 0 4px;
`;

export const ScriptPane = styled.div`
  height: 100%;
  width: 100%;

  white-space: pre-wrap;

  padding-left: 24px;
  padding-right: 24px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

export const ReplacePadding = styled.div`
  padding: 12px 11px 11px 11px;
`;
export const ResponseTableStyles = styled.div`
  height: calc(87vh - 310px);
  table-layout: fixed;
  word-wrap: break-word;
  overflow: auto;
  position: relative;
  min-height: 310px;
  & table {
    --color-row-border: var(--color-gray-300);
    --color-header-border: var(--color-gray-300);
    --color-row--selected: var(--color-gray-200);
    --color-th: var(--color-gray-900);

    border-collapse: collapse;
    width: 100%;
  }
  & table tbody {
  }
  & th:nth-child(2) {
    width: 30%;
  }

  & td:nth-child(2) {
    text-overflow: ellipsis;
    width: 30%;
  }

  & th:nth-child(1) {
    width: 40%;
  }

  & td:nth-child(1) {
    text-overflow: ellipsis;
    width: 40%;
  }
  td {
    padding: 0.75rem 0 0.5rem;
  }

  tr + tr {
    border-top: 1px solid var(--color-row-border);
  }

  tr.selected {
    background-color: var(--color-row--selected);
  }

  th {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    border-bottom: 2px solid var(--color-header-border);
    color: var(--color-th);
    font-size: var(--fs-base);
    font-weight: var(--fw-bold);
    padding: 0.5rem;
    text-align: left;
    white-space: nowrap;
    background: white;
    z-index: 2;
  }
  .flex-horizontal {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }

  .mt-1 {
    margin-top: 2px;
  }

  .mt-2 {
    margin-top: 4px;
  }
  .mt-3 {
    margin-left: 1rem;
    margin-right: 1rem;
  }
`;

export const TombStoneWrapper = styled.div`
  margin-top: 2rem;
  font-size: 16px;
  color: #333333;
  border-radius: 3px;
  height: 7.375rem;
  background-color: #f1f1f1;
  border: 1px solid #adadad;

  display: flex;
  margin-bottom: 1.5rem;
  .nameColumn {
    width: 92px;
    float: left;
    margin: 1rem;
  }
  .idColumn {
    width: 94px;
    float: left;
    height: 100%;
    margin: 1rem;
  }
  .descColumn {
    width: calc(100% - 304px);
    float: left;
    margin: 1rem;
  }
  .editColumn {
    width: 57px;
    float: right;
    min-width: 50px;
    margin-top: 1rem;
    margin-right: 1rem;
  }
  .separator {
    margin-top: 1rem;
    width: 1px;
    height: 5.375rem;

    border-left: 1px solid #ccc;
  }
  .hideOverflow {
    overflow: hidden;
  }
  table {
  }
  th {
    text-align: left;
    padding-bottom: 0.5rem;
    font-size: 18px;
  }

  .overflowContainer {
    height: 48px;
    overflow: hidden;
    vertical-align: top;
    width: 100%;
    -webkit-box-orient: vertical;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    font-size: 16px;
    font-weight: 400;
    font-family: 'acumin-pro-semi-condensed';
    line-height: 24px;
    word-wrap: break-word;
    word-break: break-word;
  }
`;

export const TaskEditorTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const Edit = styled.div`
  .flexRow {
    display: flex;
    flex-direction: row;
  }

  .badgePadding {
    margin: 6px 0 0 5px;
  }

  a {
    margin-right: 4px;
    text-decoration: underline;
    line-height: 28px;
    font-size: 18px;
  }
  display: flex;
  flex-direction: row;
`;
export const ScrollPane = styled.div`
  overflow-y: scroll;
  max-height: calc(100vh - 230px);
  width: 100%;
`;
export const TextLoadingIndicator = styled.div`
  animation: blinker 1s linear infinite;
  font-size: 16px;
  font-style: italic;
  text-align: center;
  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
`;

export const Tooltip = styled.div`
  position: relative;
  p {
    display: none;
    position: absolute;
  }
  &:hover p {
    display: block;
    margin: 0;
    padding: 3px 7px;
    background: #ffffff;
    border: 1px solid grey;
    bottom: -37px;
    width: max-content;
    min-width: 200px;
    font-size: 16px;
  }
`;
