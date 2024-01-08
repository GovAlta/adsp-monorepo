import styled from 'styled-components';

export const PopulateTemplateWrapper = styled.div`
  display: flex;
  margin-left: 3px;
  margin-top: 1.5rem;
`;
export const EditorPadding = styled.div`
  border: 1px solid grey;
  border-radius: 3px;
  padding: 0.15rem;

  .monaco-scrollable-element {
    margin-top: 5px !important;
  }
  .margin-view-overlays {
    margin-top: 5px !important;
  }
`;

export const FakeButton = styled.div`
  height: 42px;
`;

export const InlinePadding = styled.div`
  position: fixed;
  display: flex;
  flex-direction: row;
  align-items: center;

  .triangle {
    margin-top: 5px;
    margin-bottom: -10px;
    z-index: 3;
  }
  .bubble-helper {
    margin-bottom: -11px;
    display: flex;
    flex-direction: column;
  }
  .triangle-width {
    width: 25px;
  }
`;

export const InfoCirclePadding = styled.div`
  margin-top: 8px;
`;

export const ViewBox = styled.div`
  position: fixed;
  z-index: 2;
  margin-top: -20px;
  .bubble-border {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 10px 12px 8px 12px;
    margin-right: 10px;
    gap: 8px;

    width: 372px;
    height: 100%;
    left: 0px;
    top: 12px;

    background: #ffffff;
    box-shadow: 0px -1px 6px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
  }

  .overflow-wrap {
    overflow-wrap: anywhere;
  }

  .small-close-button {
    width: 10px;
    margin-left: auto;
    margin-top: -10px;
  }
`;

export const RightAlign = styled.div`
  margin-top: 8px;
  margin-bottom: 24px;
  text-align: end;
`;
export const DispositionFormItem = styled.div`
  margin-bottom: 1.5rem;
  margin-left: 3px;
  margin-right: 3px;
`;

export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 12px;
  padding: 16px;
  text-align: left;
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

export const ConfigFormWrapper = styled.div`
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
    font-size: 18px;
  }
`;
export const FormEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-spacing-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-spacing-2xs);
    margin-top: var(--goa-spacing-xl);
  }

  .info-circle {
    margin: 5px 0 0 5px;
  }
`;

export const FormEditorTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const BadgeWrapper = styled.div`
  margin-left: 1rem;
`;

export const ButtonBox = styled.div`
  width: 2.15rem;
`;

export const PaddingRight = styled.div`
  margin-right: 12px;
`;

export const ButtonRight = styled.div`
  margin-top: 8px;
  text-align: end;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;
export const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 1rem;
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

export const NameDescriptionDataSchema = styled.div`
  flex: 6;
  padding-right: 3rem;
`;

export const FormPermissions = styled.div`
  flex: 4;
`;
export const ScrollPane = styled.div`
  overflow-y: scroll;
  width: 100%;
  max-height: calc(100vh - 230px);
`;

export const OuterNotificationTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;
// Edit Template components
export const TemplateEditorContainer = styled.div`
  padding-right: 1rem;
  flex: auto;
  margin-top: 4rem;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }

  .reduce-margin {
    margin-top: 5px;
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

export const TemplateEditorContainerForm = styled.div`
  padding-right: 1rem;
  flex: auto;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }

  width: calc(100vw - 40vw - 3em);

  .reduce-margin {
    margin-top: 5px;
  }

  @media (min-width: 1279px) {
    .mobile {
      display: none;
    }
  }

  .goa-form-item {
    margin-bottom: 0rem !important;
  }

  .hr-resize {
    margin-top: 0.75rem;
  }
  .hr-resize-bottom {
    margin-bottom: 1.5rem;
    margin-top: 1rem;
  }

  .title {
    font-size: var(--fs-base);
    font-weight: var(--fw-bold);
    padding-bottom: 12px;
    padding-top: 8px;
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
export const Modal = styled.div`
  display: block;
  position: fixed;
  left: 0;
  z-index: 10000;
  width: 100%;
`;

export const PreviewTemplateContainer = styled.div`
  width: 40vw;
  margin-left: 2rem;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
`;
export const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;

export const MonacoDivTabBody = styled.div`
  display: flex;
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  min-height: 65px;
  margin-bottom: 1rem;
`;

export const EditTemplateActions = styled.div`
  display: flex;
  justify-content: left;
  gap: 1rem;
  margin: 1rem 0 2rem 0;
`;

// preview template components
export const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 85%;
  margin-right: 3rem;
`;

export const SubjectPreview = styled.div`
  background-color: white;
  padding-left: 1rem;
`;

export const FormEditorLabelWrapper = styled.div`
  display: block;
  flex-direction: row;
  overflow-x: hidden;
  overflow-y: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 4.5rem;

  .badge {
    margin: 0px 0px 0px 3px;
  }
`;

export const SpinnerSpace = styled.div`
  margin: 10px 9px 10px 14px;
  float: right;
`;

export const SpinnerPadding = styled.div`
  margin: 200px 0 0 0;
`;

// export const SpinnerModalPadding = styled.div`
//   margin: 0 0 0 0;
//   height: 467px;
// `;

export const SpinnerPaddingSmall = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
export const OverflowWrap = styled.div`
  overflow-wrap: break-word;
  overflow-y: hidden;
`;

export const PreviewTopStyle = styled.div`
  margin: 3px 3px 0 3px;
  display: flex;
  flex-direction: row;
  justify-content: left;
  gap: 1rem;
`;

export const PreviewTopStyleWrapper = styled.div`
  .hr-resize {
    margin-top: calc(0.75rem - 3px);
  }
`;

export const FormTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const FormEditorContainer = styled.div`
  width: 50%;
`;
export const FormPreviewContainer = styled.div`
  width: 50%;
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

export const FormFormItem = styled.div`
  margin-bottom: 1.5rem;
  margin-left: 3px;
  margin-right: 3px;
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
  margin-left: 3px;
  margin-right: 3px;
`;

export const ErrorMsg = styled.div`
   {
    display: inline-flex;
    color: var(--color-red);
    pointer-events: none;
    gap: 0.25rem;
  }
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

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 4px;
  }
`;

export const PRE = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-line-height-05);
  padding: var(--goa-space-m);
`;
