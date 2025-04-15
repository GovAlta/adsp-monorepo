import styled from 'styled-components';
import { PreviewPortal } from './previewPortal';
import { SlackPreviewPortal } from './slackPreviewPortal';
import { SmsPreviewPortal } from './smsPreviewPortal';

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
  height: calc(100vh - 650px);
  min-height: 65px;

  @media (max-width: 1420px) {
    height: calc(100vh - 560px);
  }
  @media (max-height: 920px) {
    height: calc(100vh - 675px);
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
