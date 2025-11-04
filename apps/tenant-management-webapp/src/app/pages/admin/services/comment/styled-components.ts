import styled from 'styled-components';

export const Topics = styled.div`
  padding-right: 3px;
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
    margin-right: 0.5rem;
    text-decoration: underline;
    line-height: 28px;
    font-size: 18px;
  }
  display: flex;
  flex-direction: row;
  margin-right: 1rem;
  margin-top: 0.5rem;
`;

export const ConfigCommentWrapper = styled.div`
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
    width: calc(100% - 236px);
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
    font-size: 18px;
  }
`;
export const CommentEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-space-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-space-2xs);
    margin-top: var(--goa-space-xl);
  }
`;

export const CommentEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

export const NotificationTemplateEditorContainer = styled.div`
  display: flex;
  flex: auto;
  margin-top: 6px;
  padding-left: var(--goa-space-xl);
  padding-right: var(--goa-space-xl);
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;

export const NameDescriptionDataSchema = styled.div`
  flex: 6;
  padding-right: var(--goa-space-2xl);
`;

export const CommentPermissions = styled.div`
  flex: 4;
`;
export const ScrollPane = styled.div`
  overflow-y: scroll;
  max-height: calc(100vh - 230px);
`;

export const OuterNotificationTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

export const ProgressWrapper = styled.div`
  margin-left: 30%;
`;

export const ButtonPadding = styled.div`
  padding-top: var(--goa-space-l);
`;

export const Modal = styled.div`
  display: block;
  position: fixed;
  left: 0;
  z-index: 10000;
  width: 100%;
`;

export const SpinnerModalPadding = styled.div`
  margin: 0 0 0 0;
  height: 467px;
`;

export const SpinnerPaddingSmall = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
export const OverflowWrap = styled.div`
  overflow-wrap: break-word;
  overflow-y: hidden;
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

export const CommentCommentItem = styled.div`
  margin-bottom: var(--goa-space-l);
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
    white-space: normal;
  }
`;

export const IconDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  goa-icon-button {
    margin: 0 4px;
  }
`;

export const HeaderFont = styled.div`
  font: var(--goa-typography-heading-m);
  padding-bottom: var(--goa-space-l);
  padding-top: var(--goa-space-l);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TableDiv = styled.div`
  .noPadding {
    padding: 0;
  }
  word-wrap: break-word;
  table-layout: fixed;
  margin-top: var(--goa-space-m);
  & td:first-child {
    width: 323px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
  }
  & td:nth-child(2) {
    width: 270px;
    word-wrap: break-word;
    word-break: break-word;
  }

  & th:last-child {
    text-align: center;
  }
  & td:last-child {
    width: 128px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }
  & .meta {
    padding: 0;
  }
`;

export const DescriptionItem = styled.div`
  margin-left: 0px;
  margin-right: 0px;
`;

export const CommentsList = styled.div`
  border: 1px solid #adadad;
  height: 108px;
  border-radius: 4px;
  width: 673px;
  margin-bottom: 1rem;
  background-color: var(--goa-color-text-light);
  padding: 0.75rem 1rem;
`;
export const CommentsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
export const CommentsHeadGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: start;
`;
export const CommentsHeading = styled.div`
  font-size: var(--goa-font-size-4);
  font-weight: var(--goa-font-weight-bold);
  line-height: var(--goa-line-height-3);
  letter-spacing: 0em;
  text-align: left;
  color: var(--goa-color-text-default);
`;
export const CommentsDate = styled.div`
  font-size: var(--goa-font-size-2);
  font-weight: var(--goa-font-weight-regular);
  line-height: var(--goa-line-height-2);
  letter-spacing: 0em;
  text-align: left;
  color: var(--goa-color-text-disabled);
  margin-left: var(--goa-space-m);
`;
export const CommentsActions = styled.div`
  padding: 0px, 4px, 0px, 4px;
`;
export const CommentBody = styled.div`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #333333;
  letter-spacing: 0em;
  text-align: left;
  text-wrap: wrap;
`;
export const TopicDelete = styled.div`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #333333;
  text-align: left;
  padding-top: 1rem;
`;
export const LoadMoreCommentsWrapper = styled.div`
  padding-top: var(--goa-space-xs);
`;
export const CommentWrapper = styled.div`
  white-space: normal;
  display: inline;
  font-weight: bold;
`;
export const CommentLoader = styled.div`
  text-align: center;
`;
export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
`;

export const RolesContainer = styled.div`
  padding: var(--goa-space-l);
  display: flex;
  flex-direction: column;
  background: var(--goa-color-greyscale-100);
`;
export const RolesWrap = styled.div`
  font: var(--goa-typography-heading-s);
  text-align: left;
  display: flex;
  align-items: center;
  span {
    font: var(--goa-typography-body-m);
    padding-left: var(--goa-space-2xs);
  }
`;
export const Gap = styled.div`
  padding: var(--goa-space-s);
`;
