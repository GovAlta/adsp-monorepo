import React from 'react';
import {
  FileTypeTemplateEditorContainer,
  OuterFileTypeTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
  HideTablet,
} from './styled-components';
import { TabletMessage } from '@components/TabletMessage';
import { useHistory } from 'react-router-dom';
import { AddEditFileTypeDefinitionEditor } from './addEditFileTypeDefinitionEditor';

export const FileTypeDefinitionEditor = (): JSX.Element => {
  const history = useHistory();

  const goBack = () => {
    history.push({
      pathname: '/admin/services/file',
    });
  };

  return (
    <>
      <Modal data-testid="template-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={true} />
        <ModalContent>
          <OuterFileTypeTemplateEditorContainer>
            <TabletMessage goBack={goBack} />
            <HideTablet>
              <FileTypeTemplateEditorContainer>
                <AddEditFileTypeDefinitionEditor />
              </FileTypeTemplateEditorContainer>
            </HideTablet>
          </OuterFileTypeTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
