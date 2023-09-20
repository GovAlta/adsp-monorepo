import React from 'react';
import {
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  HideTablet,
} from './styled-components';
import { ModalContent } from '../styled-components';
import { useHistory } from 'react-router-dom';
import { QueueModalEditor } from './queueModalEditor';
import { TabletMessage } from '@components/TabletMessage';

export const TaskDefinitionEditor = (): JSX.Element => {
  const history = useHistory();

  const goBack = () => {
    history.push({
      pathname: '/admin/services/task',
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
                <QueueModalEditor />
              </NotificationTemplateEditorContainer>
            </HideTablet>
          </OuterNotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
