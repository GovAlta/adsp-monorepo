import React from 'react';
import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  HideTablet,
} from '../styled-components';
import { ModalContent } from '../../styled-components';
import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useHistory } from 'react-router-dom';
import { TabletMessage } from '@components/TabletMessage';

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
        <ModalContent>
          <OuterNotificationTemplateEditorContainer>
            <TabletMessage goBack={goBack} />
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
