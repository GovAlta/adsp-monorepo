import React from 'react';
import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
  TabletMessage,
  HideTablet,
} from '../styled-components';
import { GoAButton } from '@abgov/react-components-new';
import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useHistory } from 'react-router-dom';

export const PdfTemplatesEditor = (): JSX.Element => {
  const history = useHistory();

  const goBack = () => {
    history.push({
      pathname: '/admin/services/pdf',
      search: '?templates=true',
    });
  };

  return (
    <>
      <Modal data-testid="template-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={true} />
        <ModalContent>
          <OuterNotificationTemplateEditorContainer>
            <TabletMessage>
              <h1>This editor requires your device to be at least 1440 pixels wide and 630 pixels high</h1>
              <h3>Please rotate your device</h3>
              <h3>For the best experience, please use a Desktop</h3>
              <GoAButton
                onClick={() => {
                  goBack();
                }}
                testId="go-back-previous"
                type="tertiary"
              >
                Go back
              </GoAButton>
            </TabletMessage>
            <HideTablet>
              <NotificationTemplateEditorContainer>
                <TemplateEditor />

                <PreviewTemplateContainer>
                  <PreviewTemplate channelTitle="PDF preview" />
                </PreviewTemplateContainer>
              </NotificationTemplateEditorContainer>
            </HideTablet>
          </OuterNotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
