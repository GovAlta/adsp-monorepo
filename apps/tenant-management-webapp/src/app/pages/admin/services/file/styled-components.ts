import styled from 'styled-components';

export const RetentionPolicyLabel = styled.label`
  font-size: 24px !important;
  line-height: 32px;
  margin-top: 24px;
  font-weight: normal !important;
`;

export const FileIdItem = styled.div`
  background: #f1f1f1;
  .goa-input {
    background: #f1f1f1 !important;
  }
  .input--goa {
    background: #f1f1f1 !important;
  }
`;
export const ModalOverwrite = styled.div`
  .modal {
    max-height: 95% !important;
    min-width: 37.5em;
    max-width: 2000px;
  }

  .title {
    font-weight: 700;
    font-size: var(--fs-lg);
    margin-top: 15px;
  }
`;

export const AnonymousReadWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;

export const RetentionPolicyWrapper = styled.div`
  margin-top: 12px;
  margin-bottom: 12px;
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

export const InfoCircleWrapper = styled.div`
  position: relative;
  top: 3px;
  transform: scale(1.2);
  margin-left: 0.5rem;
  display: inline-block;
`;

export const RetentionToolTip = styled.p`
  font-size: 16px !important;
  font-weight: normal;
  line-height: 1.5rem;
  z-index: 1000;
`;

export const FileTypeEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-spacing-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-spacing-2xs);
    margin-top: var(--goa-spacing-xl);
  }
`;

export const FileTypeEditorTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const SpinnerPadding = styled.div`
  margin: 200px 0 0 0;
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

  @media (min-height: 630px) {
    @media (min-width: 1440px) {
      display: none;
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

export const FileTypeTemplateEditorContainer = styled.div`
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

export const OuterFileTypeTemplateEditorContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

export const NameDescriptionDataSchema = styled.div`
  flex: 6;
  padding-right: 3rem;
`;

export const FileTypePermissions = styled.div`
  flex: 4;
`;

export const ScrollPane = styled.div`
  overflow-y: scroll;
  max-height: calc(100vh - 230px);
`;

export const FileTypesEditorTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const FinalButtonPadding = styled.div`
  padding-top: var(--goa-spacing-l);
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

export const ConfigTombStoneWrapper = styled.div`
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
