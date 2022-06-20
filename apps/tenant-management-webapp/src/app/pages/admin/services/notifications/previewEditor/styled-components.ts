import styled, { createGlobalStyle } from 'styled-components';
import { PreviewPortal } from '../previewPortal';
import { SlackPreviewPortal } from '../slackPreviewPortal';
import { SmsPreviewPortal } from '../smsPreviewPortal';
export const NotificationTemplateEditorContainer = styled.div`
  display: flex;
  padding-left: 3rem;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
`;
// Edit Template components
export const TemplateEditorContainer = styled.div`
  width: 40%;
  padding-right: 1rem;
  margin-top: 4rem;
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
  width: 60%;
  margin-left: 2rem;
  padding-top: 4rem;
  padding-left: 2rem;
  background-color: #00000075;
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
  height: calc(100vh - 510px);

  @media (max-width: 1420px) {
    height: calc(100vh - 560px);
  }
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
  margin-bottom: 2rem;
`;

export const SlackPreview = styled(SlackPreviewPortal)`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: 2rem;
`;
export const SMSBodyPreview = styled(SmsPreviewPortal)`
  background-color: white;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
  flex-grow: 1;
  margin-bottom: 2rem;
`;
