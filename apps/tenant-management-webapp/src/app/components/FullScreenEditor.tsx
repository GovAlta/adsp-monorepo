import { RootState } from '@store/index';
import { FunctionComponent, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { NotificationBanner } from 'app/notificationBanner';
import { TabletMessage } from './TabletMessage';

const NotificationBannerWrapper = styled.div`
  top: 0;
  position: absolute;
  z-index: 9999999;
  left: 0;
  right: 0;
`;

const Modal = styled.div<{ isNotificationActive: boolean }>`
  display: block;
  position: fixed;
  left: 0;
  z-index: 10000;
  width: 100%;
  top: ${(props) => (props.isNotificationActive ? `93px` : `0px`)};
`;

const ModalContent = styled.div`
  background: var(--goa-color-greyscale-white);
  margin-top: -24px;
  padding-top: 24px;
`;

const HideTablet = styled.div`
  @media (max-height: 629px) {
    display: none;
  }

  @media (max-width: 1439px) {
    display: none;
  }
`;

const OuterEditorContainer = styled.div<{ $previewWidth: string }>`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  & .editor {
    display: flex;
    margin-top: 0px;
    padding-top: var(--goa-space-xs);
    padding-left: var(--goa-space-xl);
    width: 100%;
    height: 100vh;
    overflow: hidden;
    box-sizing: border-box;
    > section {
      display: flex;
      flex: 1;
      flex-direction: column;
      .editorMain {
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
    &:hover {
      overflow: auto;
    }
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
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const isNotificationActive = latestNotification && !latestNotification.disabled;

  return (
    <>
      <NotificationBannerWrapper>
        <NotificationBanner />
      </NotificationBannerWrapper>
      <Modal data-testid="template-form" isNotificationActive={isNotificationActive}>
        <ModalContent>
          <OuterEditorContainer $previewWidth={previewWidth}>
            <TabletMessage goBack={onGoBack} />
            <HideTablet>
              <div className="editor">
                {editor}
                <div className="preview">{preview}</div>
              </div>
            </HideTablet>
          </OuterEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
