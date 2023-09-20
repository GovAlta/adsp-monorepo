import React from 'react';
import {
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  HideTablet,
} from '../styled-components';
import { ModalContent } from '../../styled-components';

import { useHistory } from 'react-router-dom';
import { AddEditCommentTopicTypeEditor } from './addEditCommentTopicTypeEditor';
import { TabletMessage } from '@components/TabletMessage';

export const CommentTopicTypesEditor = (): JSX.Element => {
  const history = useHistory();

  const goBack = () => {
    history.push({
      pathname: '/admin/services/form',
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
                <AddEditCommentTopicTypeEditor />
              </NotificationTemplateEditorContainer>
            </HideTablet>
          </OuterNotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
