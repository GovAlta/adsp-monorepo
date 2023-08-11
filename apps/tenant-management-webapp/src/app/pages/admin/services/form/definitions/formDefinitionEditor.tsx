import React from 'react';
import {
  NotificationTemplateEditorContainer,
  OuterNotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
  TabletMessage,
  HideTablet,
} from '../styled-components';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components-new';

import { useHistory, useParams } from 'react-router-dom';
import { AddEditFormDefinitionEditor } from './addEditFormDefinitionEditor';
import { updateFormDefinition } from '@store/form/action';
import { defaultFormDefinition } from '@store/form/model';

export const FormDefinitionEditor = (): JSX.Element => {
  const history = useHistory();

  const goBack = () => {
    history.push({
      pathname: '/admin/services/form',
      search: '?templates=true',
    });
  };

  const dispatch = useDispatch();

  return (
    <>
      <Modal data-testid="template-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={true} />
        <ModalContent>
          <OuterNotificationTemplateEditorContainer>
            <TabletMessage>
              <h1>This editor requires your device to be at least 1440 pixels wide and 920 pixels high</h1>
              <h3>Please rotate your device</h3>
              <h3>For the best experience, please use a Desktop</h3>
              <GoAButton
                onClick={() => {
                  goBack();
                }}
                data-testid="template-form-close"
                type="tertiary"
              >
                Go back
              </GoAButton>
            </TabletMessage>
            <HideTablet>
              <NotificationTemplateEditorContainer>
                {' '}
                <AddEditFormDefinitionEditor
                  isEdit={false}
                  onSave={(definition) => {
                    dispatch(updateFormDefinition(definition));
                  }}
                  onClose={(definition) => {
                    console.log(definition);
                  }}
                />
              </NotificationTemplateEditorContainer>
            </HideTablet>
          </OuterNotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
