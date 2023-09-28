import React from 'react';
import { OuterPDFTemplateEditorContainer, Modal, HideTablet, PDFTemplateEditorContainer } from '../styled-components';
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
          <OuterPDFTemplateEditorContainer>
            <TabletMessage goBack={goBack} />

            <HideTablet>
              <PDFTemplateEditorContainer>
                <AddEditFormDefinitionEditor />
              </PDFTemplateEditorContainer>
            </HideTablet>
          </OuterPDFTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
