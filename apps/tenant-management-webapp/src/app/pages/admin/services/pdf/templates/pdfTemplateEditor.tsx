import React from 'react';
import {
  PreviewTemplateContainer,
  PDFTemplateEditorContainer,
  OuterPDFTemplateEditorContainer,
  Modal,
  HideTablet,
  ModalContent,
  NotificationBannerWrapper,
} from '../styled-components';
import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useNavigate } from 'react-router-dom';
import { TabletMessage } from '@components/TabletMessage';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { NotificationBanner } from 'app/notificationBanner';

export const PdfTemplatesEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/pdf?templates=true');
  };

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
          <OuterPDFTemplateEditorContainer>
            <TabletMessage goBack={goBack} />
            <HideTablet>
              <PDFTemplateEditorContainer>
                <TemplateEditor />

                <PreviewTemplateContainer>
                  <PreviewTemplate channelTitle="PDF preview" />
                </PreviewTemplateContainer>
              </PDFTemplateEditorContainer>
            </HideTablet>
          </OuterPDFTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
