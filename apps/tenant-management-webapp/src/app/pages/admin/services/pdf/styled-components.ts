import styled, { createGlobalStyle } from 'styled-components';
import { PreviewPortal } from './templates/previewPortal';

export const FileTableStyles = styled.div`
  .flex-horizontal {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }

  margin: 1rem 0 1rem;
`;

export const PaddingRight = styled.div`
  margin-right: 12px;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 1rem;
`;
export const NotificationTemplateEditorContainer = styled.div`
  display: flex;
  flex: auto;
  padding-left: 3rem;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
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

export const TemplateEditorContainerPdf = styled.div`
  padding-right: 1rem;
  flex: auto;
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

  .goa-form-item {
    margin-bottom: 0rem !important;
  }

  .hr-resize {
    margin-top: 0.75rem;
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

export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden` : `auto`)};
  }
`;
export const ModalContent = styled.div`
  background: white;
`;
export const PreviewTemplateContainer = styled.div`
  width: 612px;
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
export const MonacoDivBody = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  height: calc(92vh - 366px - 7rem);
  min-height: 2rem;
  margin: 0.5rem 0 0 0;
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
  margin-right: 2rem;
`;

export const SubjectPreview = styled.div`
  background-color: white;
  padding-left: 1rem;
`;

export const BodyPreview = styled(PreviewPortal)`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: 1rem;
  border: 1.5rem solid #b2d4ed;
`;

export const PdfEditorLabelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  .badge {
    margin: 0px 0px 0px 3px;
  }
`;

export const PdfConfigFormWrapper = styled.div`
  padding-left: 3px;
  border: solid 1px #dcdcdc;
  border-radius: 3px;
  height: 8rem;
  background-color: #f1f1f1;
  width: 100%;
  display: flex;
  direction: row;
  margin-bottom: 2rem;
  .nameColumn {
    width: 15%;
    float: left;
    min-width: 100px;
  }
  .idColumn {
    width: 15%;
    float: left;
    height: 100%;

    min-width: 100px;
  }
  .descColumn {
    width: 60%;
    float: left;
    height: 100%;
  }
  .editColumn {
    width: 8%;
    float: right;
    min-width: 50px;
  }
  .separator {
    margin-top: 1rem;
    width: 1px;
    height: 6rem;

    border-left: 1px solid #ccc;
  }
  table {
    margin: 0.5rem 1rem 1rem 1rem;
  }
  th {
    text-align: left;
  }
`;

export const PdfEditActionLayout = styled.div`
  position fixed;
  bottom: 2rem;
`;

export const PdfEditActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const SpinnerSpace = styled.div`
  margin: 10px 9px 10px 14px;
  float: right;
`;

export const GenerateButtonPadding = styled.div`
  margin: 0 0 0 14px;
`;

export const GeneratorStyling = styled.div`
  .extra-padding {
    margin: 20px 0 0 0;
  }

  .topBottomPadding {
    padding: 15px 0;
  }

  .row-flex {
    display: flex;
    flex-direction: row;
  }

  .indicator {
    background: #f3f3f3;
    min-width: 160px;
  }

  .event-stream {
    flex: 3;
    fontsize: 12px;
  }

  .button-margin {
    margin: 0 0 20px 0;
  }
`;
export const SpinnerPadding = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
export const Edit = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 1rem;
  margin-top: 0.5rem;
`;
export const OverflowWrap = styled.div`
  overflow-wrap: break-word;
`;

export const PreviewTopStyle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  gap: 1rem;
`;

export const TextAreaDiv = styled.div`
  margin-bottom: 1rem;
`;

export const PDFTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;
