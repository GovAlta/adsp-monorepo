import React, { useEffect } from 'react';
import { Modal, HideTablet, FormTemplateEditorContainer, OuterFormTemplateEditorContainer } from '../styled-components';
import { ModalContent } from '../../styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { AddEditFormDefinitionEditor } from './addEditFormDefinitionEditor';
import { TabletMessage } from '@components/TabletMessage';
import { useDispatch, useSelector } from 'react-redux';
import { openEditorForDefinition } from '@store/form/action';
import { RootState } from '@store/index';

export const FormDefinitionEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const selectedId = useSelector((state: RootState) => state.form.editor.selectedId);
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  useEffect(() => {
    if (id !== selectedId) {
      dispatch(openEditorForDefinition(id));
    }
  });

  return (
    <Modal data-testid="template-form">
      <ModalContent>
        <OuterFormTemplateEditorContainer>
          <TabletMessage goBack={() => navigate('/admin/services/form?definitions=true')} />

          <HideTablet>
            <FormTemplateEditorContainer>
              <AddEditFormDefinitionEditor />
            </FormTemplateEditorContainer>
          </HideTablet>
        </OuterFormTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
