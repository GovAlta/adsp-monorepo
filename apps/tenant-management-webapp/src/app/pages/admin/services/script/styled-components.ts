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

export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden` : `auto`)};
  }
`;
export const NotificationBannerWrapper = styled.div`
  top: 0;
  position: fixed;
  left: 0;
  right: 0;
`;
export const Modal = styled.div<{ open: boolean; isNotificationActive: boolean }>`
  display: ${(props) => (props.open ? `block` : `none`)};
  position: fixed;
  top: ${(props) => (props.isNotificationActive ? `81px` : `0px`)};
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
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  min-height: 65px;
  section {
    padding-bottom: 0.5rem;
  }
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
  padding-left: var(--goa-space-xl);
  padding-right: var(--goa-space-xl);
  height: 100vh;
  margin-top: 0px;
  overflow: hidden;
  box-sizing: border-box;
`;
export const EditScriptActions = styled.div`
  display: flex;
  justify-content: left;
  gap: 1rem;
  padding-top: var(--goa-space-l);
  padding-left: var(--goa-space-2xs);
  border-top: 1px solid #adadad;
  box-shadow: -2px -3px 3px rgba(0, 0, 0, 0.1);
  margin: 0 0 var(--goa-space-xl) 0;
`;
export const MonacoDivTabBody = styled.div`
  display: flex;
  overflow: hidden;
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  min-height: 65px;
  flex-direction: column;
`;
export const MonacoDivTriggerEventsBody = styled.div`
  display: flex;
  overflow: hidden;
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  min-height: 65px;
  flex-direction: column;
`;
export const ScriptEditorContainer = styled.div<{ isNotificationActive: boolean }>`
  width: 50%;
  height: calc(100vh - ${(props) => (props.isNotificationActive ? `81px` : `0px`)});
  padding-right: 1.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  height: 100%;
  padding-top: var(--goa-space-xs);
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
    margin: 0 0 var(--goa-space-s) 0px;
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
    font-size: var(--goa-font-size-4);
    line-height: calc(var(--goa-font-size-4) + 1rem);
  }

  .hr-resize {
    margin-bottom: var(--goa-space-m);
    margin-top: 0;
  }
  .styled-hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 0;
  }

  /* Top-facing shadow */
  .styled-hr-top {
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
  }

  /* Bottom-facing shadow */
  .styled-hr-bottom {
    box-shadow: -2px -3px 3px rgba(0, 0, 0, 0.1);
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

  padding-left: 1.5rem;
  padding-right: 24px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

export const ReplacePadding = styled.div`
  padding: 12px 11px 11px 11px;
`;
export const ResponseTableStyles = styled.div`
  height: calc(85vh - 315px);
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
    display: flex;
  }

  & th:nth-child(1) {
    width: 40%;
  }

  & td:nth-child(1) {
    text-overflow: ellipsis;
    width: 40%;
  }
  td {
    padding: var(--goa-space-s) var(--goa-space-m) var(--goa-space-xs) var(--goa-space-m);
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
    font-size: var(--goa-font-size-4);
    font-weight: var(--fw-bold);
    padding: 0 var(--goa-space-m) var(--goa-space-xs) var(--goa-space-m);
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
  margin-top: var(--goa-space-m);
  font-size: var(--goa-font-size-3);
  color: var(--goa-color-text-default);
  border-radius: var(--goa-borderRadius-m);
  height: 7.375rem;
  background-color: var(--goa-color-greyscale-100);
  border: 1px solid #adadad;

  display: flex;
  margin-bottom: var(--goa-space-l);
  .nameColumn {
    width: 92px;
    float: left;
    margin: var(--goa-space-m);
  }
  .idColumn {
    width: 94px;
    float: left;
    height: 100%;
    margin: var(--goa-space-m);
  }
  .descColumn {
    width: calc(100% - 304px);
    float: left;
    margin: var(--goa-space-m);
  }
  .editColumn {
    width: 57px;
    float: right;
    min-width: 50px;
    margin-top: var(--goa-space-m);
    margin-right: var(--goa-space-m);
  }
  .separator {
    margin-top: var(--goa-space-m);
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
    padding-bottom: var(--goa-space-xs);
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
    font-size: var(--goa-font-size-3);
    font-weight: var(--goa-fontWeight-regular);
    font-family: 'acumin-pro-semi-condensed';
    line-height: var(--goa-lineHeight-2);
    word-wrap: break-word;
    word-break: break-word;
  }
`;

export const ScriptEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
  font-family: var(--goa-font-family-sans);
  margin-bottom: var(--goa-space-s);
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
    margin-right: var(--goa-space-2xs);
    text-decoration: underline;
    line-height: var(--goa-lineHeight-3);
    font-size: var(--goa-font-size-4);
  }
  display: flex;
  flex-direction: row;
`;
export const ScrollPane = styled.div`
  overflow-y: auto;
  width: 100%;
`;

export const TriggerEventScrollPane = styled.div`
  overflow-y: auto;
  width: 100%;
  margin-bottom: var(--goa-space-xs) !important;
`;

export const TextLoadingIndicator = styled.div`
  animation: blinker 1s linear infinite;
  font-size: var(--goa-font-size-3);
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
    font-size: var(--goa-font-size-3);
  }
`;

export const AddTriggerButtonPadding = styled.div`
  margin-top: var(--goa-space-m);
  text-align: end;
`;

export const ScriptEventTriggerListDefinition = styled.div`
  display: flex-inline-table;
  & .spacingLarge {
    font-weight: var(--goa-font-Weight-regular) !important;
    font-size: var(--goa-font-size-7) !important;
    font-family: var(--goa-font-family-sans) !important;
  }

  & .group-name {
    font-size: var(--goa-font-size-5);
    font-weight: var(--fw-bold);
  }

  & td:first-child {
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
      font-size: 12px;
      line-height: 16px;
      padding-top: 16px;
      padding-bottom: 16px;
      padding-left: 16px;
      padding-right: 16px;
    }
    padding: 0;
  }
`;

export const ModalOverwrite = styled.div`
  .modal {
    max-height: 95% !important;
    min-width: 37.5em;
    max-width: 2000px;
  }

  .title {
    font-weight: var(--goa-font-weight-bold);
    font-size: var(--goa-font-size-5);
    margin-top: 15px;
  }
`;
export const HideTablet = styled.div`
  @media (max-height: 629px) {
    display: none;
  }

  @media (max-width: 1439px) {
    display: none;
  }
`;
export const TabletMessage = styled.div`
  h1,
  h3 {
    text-align: center;
    margin: 40px;
  }

  text-align: center !important;
  margin-top: 90px !important;

  @media (min-height: 630px) {
    @media (min-width: 1440px) {
      display: none;
    }
  }
`;

export const OuterScriptTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin-top: 0px;
`;

export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
`;
