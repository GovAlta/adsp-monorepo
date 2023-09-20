import React from 'react';
import {
  FileTypeTemplateEditorContainer,
  OuterFileTypeTemplateEditorContainer,
  Modal,
  HideTablet,
} from './styled-components';
import { ModalContent } from '../styled-components';
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
      <Modal data-testid="fileType-form">
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
