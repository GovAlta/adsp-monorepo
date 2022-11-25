import styled, { createGlobalStyle } from 'styled-components';
import { PreviewPortal } from '../previewPortal';
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
export const Modal = styled.div<{ open: boolean }>`
  display: ${(props) => (props.open ? `block` : `none`)};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
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
  padding-top: 4rem;
  padding-left: 2rem;
  background-color: #c3c3c3;
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
  height: calc(100vh - 376px - 1.5rem);
  min-height: 2rem;
`;
export const MonacoDivHeader = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  height: calc(50vh - 210px - 0.75rem);
  min-height: 2rem;
`;
export const MonacoDivFooter = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
  height: calc(50vh - 210px - 0.75rem);
  min-height: 2rem;
`;
export const EditTemplateActions = styled.div`
  display: flex;
  justify-content: right;
  gap: 1rem;
`;

// preview template components
export const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
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
`;

export const PdfEditorLabelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  .badge {
    margin: 0px 0px 0px 3px;
  }
`;

export const PdfConfigFormWrapper = styled.div`
  .goa-form-item {
    margin-bottom: 0.2rem !important;
  }
  padding-left: 3px;
  padding-top: 1.5rem;
`;
