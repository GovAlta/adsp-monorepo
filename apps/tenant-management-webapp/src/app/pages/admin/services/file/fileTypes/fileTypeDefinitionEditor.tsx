import React from 'react';
import {
  FileTypeTemplateEditorContainer,
  OuterFileTypeTemplateEditorContainer,
  Modal,
  HideTablet,
  FileTypeModalContent,
} from '../styled-components';
import { TabletMessage } from '@components/TabletMessage';
import { useNavigate } from 'react-router-dom-6';
import { EditFileTypeDefinitionEditor } from './editFileTypeDefinitionEditor';

export const FileTypeDefinitionEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/file?fileTypes=true');
  };

  return (
    <Modal data-testid="fileType-form">
      <FileTypeModalContent>
        <OuterFileTypeTemplateEditorContainer>
          <TabletMessage goBack={goBack} />
          <HideTablet>
            <FileTypeTemplateEditorContainer>
              <EditFileTypeDefinitionEditor />
            </FileTypeTemplateEditorContainer>
          </HideTablet>
        </OuterFileTypeTemplateEditorContainer>
      </FileTypeModalContent>
    </Modal>
  );
};
