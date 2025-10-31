import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';
import { NotificationBanner } from 'app/notificationBanner';
import { TabletMessage } from './TabletMessage';

const Modal = styled.div`
  position: fixed;
  z-index: 10000;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--goa-color-greyscale-white);
  display: flex;
  flex-direction: column;
`;

const OuterEditorContainer = styled.div<{ $previewWidth: string }>`
  flex: 1;
  width: 100%;
  overflow: hidden;
  position: relative;
  & .editor {
    @media (max-height: 629px) {
      display: none;
    }
    @media (max-width: 1439px) {
      display: none;
    }
    display: flex;
    margin-top: 0px;
    padding-top: var(--goa-space-xs);
    padding-left: var(--goa-space-xl);
    height: 100%;
    width: 100%;
    overflow: hidden;
    box-sizing: border-box;
    > section {
      display: flex;
      flex: 1;
      flex-direction: column;
      .editorMain {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
    }
    h2 {
      font-size: var(--goa-font-size-7);
      line-height: var(--lh-lg);
      font-weight: var(--fw-regular);
      font-family: var(--goa-font-family-sans);
      margin-bottom: var(--goa-space-s);
    }
  }
  & .preview {
    width: ${({ $previewWidth }) => $previewWidth || 'calc(40vw + 3.9rem)'};
    flex: 1;
    margin-right: var(--goa-space-xl);
    margin-left: var(--goa-space-xl);
    margin-bottom: var(--goa-space-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
`;

interface FullScreenEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  previewWidth?: string;
  onGoBack: () => void;
}

export const FullScreenEditor: FunctionComponent<FullScreenEditorProps> = ({
  editor,
  preview,
  previewWidth,
  onGoBack,
}) => {
  return (
    <Modal>
      <NotificationBanner />
      <OuterEditorContainer $previewWidth={previewWidth}>
        <TabletMessage goBack={onGoBack} />
        <div className="editor">
          {editor}
          <div className="preview">{preview}</div>
        </div>
      </OuterEditorContainer>
    </Modal>
  );
};
