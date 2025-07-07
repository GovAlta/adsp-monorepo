import styled, { createGlobalStyle } from 'styled-components';

export const OverflowWrap = styled.div``;
export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const TableDiv = styled.div`
  .noPadding {
    padding: 0;
  }
  word-wrap: break-word;
  table-layout: fixed;
  margin-top: var(--goa-space-m);
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
  & .meta {
    padding: 0;
  }
`;

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 4px;
  }
`;

export const FormFormItem = styled.div`
  margin-bottom: 1.5rem;
  margin-left: 3px;
  margin-right: 3px;
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

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

export const NameDescriptionDataSchema = styled.div`
  flex: 6;
  padding-right: 3rem;
`;

export const TaskPermissions = styled.div`
  flex: 4;
`;
export const ScrollPane = styled.div`
  overflow-y: scroll;
  max-height: calc(100vh - 230px);
`;

export const EditorPadding = styled.div`
  border: 0px solid grey;
  border-radius: 3px;
  padding: 0.15rem;

  .monaco-scrollable-element {
    margin-top: 5px !important;
  }
  .margin-view-overlays {
    margin-top: 5px !important;
  }
`;

export const FinalButtonPadding = styled.div`
  padding-top: 20px;
`;

export const TaskEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const TaskEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-space-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-space-2xs);
    margin-top: var(--goa-space-xl);
  }
  .task-permissions-wrapper {
    table {
      border-collapse: collapse;
    }
    table.sticky {
      position: relative;
    }
    table.sticky thead {
      position: sticky;
      top: 0;
    }
    td {
      font: var(--goa-typography-body-m);
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--goa-color-greyscale-200);
    }
    table .goa-table-number-column {
      font: var(--goa-typography-number-m);
      text-align: right;
    }
    table.relaxed td {
      padding: 1rem;
    }
    th {
      background-color: var(--goa-color-greyscale-white);
      color: var(--goa-color-text-secondary);
      padding: 1rem;
      text-align: left;
      border-bottom: 2px solid var(--goa-color-greyscale-600);
      vertical-align: bottom;
    }
    th:has(goa-table-sort-header) {
      padding: 0;
    }
    tfoot td {
      background-color: var(--goa-color-greyscale-100);
    }
    tfoot tr:first-child td {
      border-top: 2px solid var(--goa-color-greyscale-200);
    }
    tfoot tr:last-child td {
      border-bottom: none;
    }
  }
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
    margin-top: 3px;
  }
  display: flex;
  flex-direction: row;
  margin-right: 1rem;
  margin-top: 0.5rem;
`;

export const ConfigTaskWrapper = styled.div`
  margin-top: 2rem;
  font-size: 16px;
  color: #333333;
  padding-left: 3px;
  border: solid 1px #dcdcdc;
  border-radius: 3px;
  height: 7.375rem;
  background-color: #f1f1f1;
  padding-right: 1rem;
  border-bottom: solid 16px #f1f1f1;
  border: solid 1px #dcdcdc;

  display: flex;
  margin-bottom: 1.5rem;
  .nameColumn {
    width: 180px;
    float: left;
    overflow: hidden;
  }
  .idColumn {
    width: 180px;
    float: left;
    height: 100%;
    overflow: hidden;
  }
  .descColumn {
    width: calc(100% - 336px);
    float: left;
    height: 100%;
    overflow: hidden;
  }
  .overflowContainer {
    border-bottom: 16px solid #f1f1f1;
    height: 64px;
    overflow: hidden;
    vertical-align: top;
  }
  .editColumn {
    width: 56px;
    float: right;
    min-width: 50px;
    margin-top: 0.5rem;
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
    margin: 1rem 1rem 1rem 1rem;
  }
  th {
    text-align: left;
    padding-bottom: 0.5rem;
  }
`;

export const NotificationTemplateEditorContainer = styled.div`
  display: flex;
  flex: auto;
  margin-top: 6px;
  padding-left: 3rem;
  padding-right: 3rem;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;

export const OuterNotificationTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;
export const Modal = styled.div`
  display: block;
  position: fixed;
  left: 0;
  z-index: 10000;
  width: 100%;
`;

export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden` : `auto`)};
  }
`;
export const ModalContent = styled.div`
  background: var(--goa-color-greyscale-white);
  margin-top: -24px;
  padding-top: 24px;
`;

export const TabletMessage = styled.div`
  h1,
  h3 {
    text-align: center;
    margin: 40px;
  }

  text-align: center !important;

  @media (min-height: 630px) {
    @media (min-width: 1440px) {
      display: none;
    }
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
export const ButtonPadding = styled.div`
  padding-top: var(--goa-space-l);
`;
export const HeaderFont = styled.div`
  font: var(--goa-typography-heading-m);
  padding-bottom: var(--goa-space-2xs);
`;

export const HelpText = styled.div`
  font-size: var(--fs-sm);
  color: var(--color-gray-900);
  line-height: calc(var(--fs-sm) + 0.5rem);
  display: flex;
  display-direction: row;
  justify-content: space-between;
  margin-top: 2px;
`;
export const DescriptionItem = styled.div`
  margin-left: 0px;
  margin-right: 0px;
`;

export const ErrorMsg = styled.div`
  display: inline-flex;
  color: var(--color-red);
  pointer-events: none;
  gap: 0.25rem;
`;

export const MoreDetails = styled.div`
  background-color: var(--goa-color-greyscale-100);
  padding: var(--goa-space-s) var(--goa-space-l) var(--goa-space-l) var(--goa-space-l);
  width: 100%;
  text-align: left;
  p {
    font-weight: bold;
    padding-top: var(--goa-space-s);
    margin-bottom: var(--goa-space-xs);
  }
  span {
  }
`;

export const IconDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  goa-icon-button {
    margin: 0 4px;
  }
`;
export const ProgressWrapper = styled.div`
  margin-left: 30%;
`;
