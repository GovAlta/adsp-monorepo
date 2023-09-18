import React from 'react';
import {
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  TabletMessage,
  HideTablet,
} from '../styled-components';
import { ModalContent, BodyGlobalStyles } from '../../styled-components';

import { GoAButton } from '@abgov/react-components-new';

import { useHistory } from 'react-router-dom';
import { AddEditCommentTopicTypeEditor } from './addEditCommentTopicTypeEditor';

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
        {/* Hides body overflow when the modal is up */}
        {/* <BodyGlobalStyles hideOverflow={true} /> */}
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
                testId="back-to-previous"
                type="tertiary"
              >
                Go back
              </GoAButton>
            </TabletMessage>
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
