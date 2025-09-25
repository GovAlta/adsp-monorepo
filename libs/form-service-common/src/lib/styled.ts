import styled from 'styled-components';

export const OverviewLayout = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
`;

export const DisplayFlex = styled.div`
  display: flex;
`;

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

export const Margin = styled.div`
  margin: var(--goa-space-s) 0 var(--goa-space-s) 0;
`;

export const ButtonIconPadding = styled.div`
  margin-top: -4px;
`;
export const ButtonIconPaddingThree = styled.div`
  margin-top: -3px;
`;

export const FakeButton = styled.div`
  height: 42px;
`;

export const RightAlign = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
  margin-left: auto;
`;
export const DispositionFormItem = styled.div`
  margin-bottom: 1.5rem;
  margin-left: 3px;
  margin-right: 3px;
`;

export const CenterPositionProgressIndicator = styled.div`
  display: flex;
  justify-content: center;
`;

export const FinalButtonPadding = styled.div`
  display: flex;
  padding-top: 20px;
  justify-content: space-between;
  align-items: center;
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
  margin-top: var(--goa-space-m);
  font-size: 16px;
  color: #333333;
  padding-left: 3px;
  border: solid 1px #dcdcdc;
  border-radius: 3px;
  height: 8.125rem;
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
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }
  .idColumn {
    width: 180px;
    float: left;
    height: 100%;
    overflow: hidden;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
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
    margin-top: var(--goa-space-s);
    margin-bottom: 0;
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-space-2xs);
    margin-top: var(--goa-space-xl);
  }

  .info-circle {
    margin: 5px 0 0 5px;
  }
`;

export const IndicatorBox = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

export const ReviewPageTabWrapper = styled.div`
  padding-top: var(--goa-space-m);
`;

export const FormEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
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

export const SubmissionConfigurationPadding = styled.div`
  padding: var(--goa-space-s);
`;

export const FormTemplateEditorContainer = styled.div`
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

  .life-cycle-auto-scroll {
    overflow-y: auto;
  }
`;

export const GoACheckboxPad = styled.div`
  margin-left: 4px;
`;

export const FormPermissions = styled.div`
  flex: 4;
`;

export const AddToggleButtonPadding = styled.div`
  padding-top: var(--goa-space-m);
`;
export const ScrollPane = styled.div`
  overflow-y: scroll;
  width: 100%;
  max-height: calc(100vh - 230px);
`;

export const OuterFormTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  z-index: 9999999999;
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
    font-size: var(--goa-font-size-4);
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
  width: 100%;
  top: 0px;
  z-index: 1000;
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
export const RolesTabBody = styled.div`
  display: flex;
  border-radius: 3px;
  min-height: 65px;
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
  height: calc(100vh - 188px);
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

export const SubmissionRecordsBox = styled.div`
  margin-bottom: 12px;
  margin-left: 4px;
`;

export const SpinnerSpace = styled.div`
  margin: 10px 9px 10px 14px;
  float: right;
`;

export const SpinnerPadding = styled.div`
  margin: 200px 0 0 0;
`;

export const SpinnerPaddingSmall = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;

export const TableDataName = styled.td`
  width: 50%;
`;

export const TableDataId = styled.td`
  width: 8.125rem;
`;

export const TableDataDescription = styled.td`
  width: 50%;
`;

export const DetailsTagHeading = styled.div`
  font: var(--goa-typography-heading-s);
  margin-bottom: var(--goa-space-s);
  margin-top: var(--goa-space-l);
`;

export const DetailsTagDefinitionIdHeading = styled.div`
  font: var(--goa-typography-heading-s);
  margin-bottom: var(--goa-space-xs);
`;

export const DetailsTagWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  justify-content: space-start;
`;
export const TagBadgePadding = styled.div`
  padding-bottom: var(--goa-space-3xs);
`;

export const TableDataScriptName = styled.td`
  width: 9.375rem;
  word-break: break-all;
`;

export const TableDataScriptId = styled.td`
  width: 8.125rem;
  word-break: break-all;
`;

export const TableDataScriptDescription = styled.td`
  word-break: break-all;
`;

export const OverflowWrap = styled.span`
  word-break: break-all;
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
  margin-top: -3px;
`;

export const FormTitle = styled.div`
  font-weight: var(--fw-regular);
  font-family: var(--goa-font-family-sans);
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

export const DescriptionItem = styled.div`
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

export const FormPreviewScrollPane = styled.div`
  overflow-y: auto;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  height: calc(100vh - 92px);
`;
export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
`;
