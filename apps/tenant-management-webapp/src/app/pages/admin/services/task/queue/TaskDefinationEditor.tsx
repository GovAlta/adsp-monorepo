import React from 'react';
import {
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
  HideTablet,
} from '../styled-components';
import { useNavigate } from 'react-router-dom';
import { QueueModalEditor } from './queueModalEditor';
import { TabletMessage } from '@components/TabletMessage';

export const TaskDefinitionEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/task?definitions=true');
  };

  return (
    <Modal data-testid="queue-editor">
      {/* Hides body overflow when the modal is up */}
      <BodyGlobalStyles hideOverflow={true} />
      <ModalContent>
        <OuterNotificationTemplateEditorContainer>
          <TabletMessage goBack={goBack} />
          <HideTablet>
            <NotificationTemplateEditorContainer>
              <QueueModalEditor />
            </NotificationTemplateEditorContainer>
          </HideTablet>
        </OuterNotificationTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
