import React from 'react';
import { Modal, HideTablet, FormTemplateEditorContainer, OuterFormTemplateEditorContainer } from '../styled-components';
import { ModalContent } from '../../styled-components';
import { useHistory } from 'react-router-dom';
import { AddEditFormDefinitionEditor } from './addEditFormDefinitionEditor';
import { TabletMessage } from '@components/TabletMessage';

export const FormDefinitionEditor = (): JSX.Element => {
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
          <OuterFormTemplateEditorContainer>
            <TabletMessage goBack={goBack} />

            <HideTablet>
              <FormTemplateEditorContainer>
                <AddEditFormDefinitionEditor />
              </FormTemplateEditorContainer>
            </HideTablet>
          </OuterFormTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
