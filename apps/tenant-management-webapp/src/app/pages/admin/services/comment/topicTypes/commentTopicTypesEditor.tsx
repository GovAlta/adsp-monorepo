import React from 'react';
import {
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  HideTablet,
} from '../styled-components';
import { ModalContent } from '../../styled-components';

import { useNavigate } from 'react-router-dom';
import { AddEditCommentTopicTypeEditor } from './addEditCommentTopicTypeEditor';
import { TabletMessage } from '@components/TabletMessage';

export const CommentTopicTypesEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/comment?templates=true');
  };

  return (
    <Modal data-testid="template-form">
      <ModalContent>
        <OuterNotificationTemplateEditorContainer>
          <TabletMessage goBack={goBack} />
          <HideTablet>
            <NotificationTemplateEditorContainer>
              <AddEditCommentTopicTypeEditor />
            </NotificationTemplateEditorContainer>
          </HideTablet>
        </OuterNotificationTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
