import styled from 'styled-components';

export const RetentionPolicyLabel = styled.label`
  font-size: var(--goa-font-size-7) !important;
  line-height: var(--goa-line-height-4);
  margin-top: var(--goa-space-l);
  font-weight: var(--goa-font-weight-regular) !important;
`;

export const FileIdItem = styled.div`
  background: var(--goa-color-greyscale-100);
  .goa-input {
    background: var(--goa-color-greyscale-100) !important;
  }
  .input--goa {
    background: var(--goa-color-greyscale-100) !important;
  }
`;

export const MakePublicPadding = styled.div`
  margin-bottom: var(--goa-space-xl);
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

export const AnonymousReadWrapper = styled.div`
  line-height: var(--goa-line-height-5);
  display: flex;
`;

export const RetentionPolicyWrapper = styled.div`
  margin-top: var(--goa-space-s);
  margin-bottom: var(--goa-space-s);
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

export const InfoCircleWrapper = styled.div`
  position: relative;
  top: 3px;
  transform: scale(1.2);
  margin-left: var(--goa-space-xs);
  display: inline-block;
  z-index: 1000;
`;

export const RetentionPeriodText = styled.div`
  font-weight: var(--goa-font-weight-bold);
  font-size: var(--goa-font-size-4);
  line-height: var(--goa-line-height-3);
`;

export const RetentionToolTip = styled.p`
  font-size: var(--goa-font-size-3) !important;
  font-weight: normal;
  line-height: var(--goa-line-height-2);
  z-index: 1000;
`;

export const FileTypeEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-space-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-space-1xs);
    margin-top: var(--goa-space-xl);
  }
`;

export const FileTypeEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--goa-line-height-4);
  font-weight: var(--goa-font-weight-regular);
`;

export const SpinnerPadding = styled.div`
  margin: 200px 0 0 0;
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
  padding-left: var(--goa-space-2xl);
  padding-right: var(--goa-space-2xl);
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

export const DropDownZIndex = styled.div`
  z-index: 100;
  position: relative;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

export const NameDescriptionDataSchema = styled.div`
  flex: 6;
  padding-right: var(--goa-space-2xl);
`;

export const FileTypePermissions = styled.div`
  flex: 4;
`;

export const ScrollPane = styled.div`
  overflow-y: scroll;
  max-height: calc(100vh - 230px);
`;
export const FileTypeModalContent = styled.div`
  background: var(--goa-color-greyscale-white);
  margin-top: -24px;
  padding-top: 24px;
`;

export const FileTypesEditorTitle = styled.div`
  font-size: var(--goa-font-size-7);
  line-height: var(--goa-line-height-4);
  font-weight: var(--goa-font-weight-regular);
`;

export const FinalButtonPadding = styled.div`
  padding-top: var(--goa-space-xs);
  position: fixed; /* Use fixed positioning to place the item relative to the viewport */
  bottom: 0; /* Align the item at the bottom of the viewport */
  width: 55%;
  margin-bottom: 4rem;
`;

export const EditorPadding = styled.div`
  border: 0px solid grey;
  border-radius: 3px;
  padding: 0.15rem;
  overflow-y: auto;
  height: calc(100vh - 500px);

  .monaco-scrollable-element {
    margin-top: 5px !important;
  }
  .margin-view-overlays {
    margin-top: 5px !important;
  }
`;

export const ConfigTombStoneWrapper = styled.div`
  margin-top: var(--goa-space-xl);
  margin-bottom: var(--goa-space-xl);
  font-size: var(--goa-fontSize-3);
  color: var(--goa-color-greyscale-black);
  padding-left: 3px;
  border: solid 1px #dcdcdc;
  border-radius: 3px;
  height: 7.375rem;
  background-color: var(--goa-color-greyscale-100);
  padding-right: var(--goa-space-m);
  border-bottom: solid 16px var(--goa-color-greyscale-100);
  border: solid 1px #dcdcdc;

  display: flex;
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
    border-bottom: 16px solid var(--goa-color-greyscale-100);
    height: 64px;
    overflow: hidden;
    vertical-align: top;
  }
  .editColumn {
    width: 56px;
    float: right;
    min-width: 50px;
    margin-top: var(--goa-space-xs);
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
    margin: var(--goa-space-m) var(--goa-space-m) var(--goa-space-m) var(--goa-space-m);
  }
  th {
    text-align: left;
    padding-bottom: var(--goa-space-xs);
  }
`;

export const FileTypeEditorWarningCalloutWrapper = styled.div`
  width: 25rem;
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
