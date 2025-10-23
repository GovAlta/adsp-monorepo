import React, { useEffect } from 'react';
import {
  Modal,
  HideTablet,
  FormTemplateEditorContainer,
  OuterFormTemplateEditorContainer,
  FormEditor,
} from '../styled-components';
import { ModalContent } from '../../styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { AddEditFormDefinitionEditor } from './addEditFormDefinitionEditor';
import { TabletMessage } from '@components/TabletMessage';
import { useDispatch, useSelector } from 'react-redux';
import { openEditorForDefinition } from '@store/form/action';
import { AppDispatch, RootState } from '@store/index';
import { initializeFormEditor } from '@store/form/action';
import { modifiedDefinitionSelector } from '@store/form/selectors';
import { rolesSelector } from '@store/access/selectors';
import { PageIndicator } from '@components/Indicator';
import { connectAgent, disconnectAgent } from '@store/agent/actions';

export const FormDefinitionEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const selectedId = useSelector((state: RootState) => state.form.editor.selectedId);
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    // This is to handle deep linking to the editor for a specific definition.
    if (id !== selectedId) {
      dispatch(openEditorForDefinition(id));
    }
  });

  const queueTasks = useSelector((state: RootState) => state.task?.queues);
  const definition = useSelector(modifiedDefinitionSelector);
  const roles = useSelector(rolesSelector);

  useEffect(() => {
    dispatch(initializeFormEditor());
  }, [dispatch]);

  useEffect(() => {
    dispatch(connectAgent());
    return () => {
      dispatch(disconnectAgent());
    };
  }, [dispatch]);

  return (
    <Modal data-testid="template-form">
      <ModalContent>
        <OuterFormTemplateEditorContainer>
          <TabletMessage goBack={() => navigate('/admin/services/form?definitions=true')} />

          <HideTablet>
            <FormTemplateEditorContainer>
              {definition?.id && realmRoles && queueTasks && fileTypes ? (
                <AddEditFormDefinitionEditor
                  key={id}
                  definition={definition}
                  roles={roles}
                  queueTasks={queueTasks}
                  fileTypes={fileTypes}
                />
              ) : (
                <FormEditor>
                  <PageIndicator />
                </FormEditor>
              )}
            </FormTemplateEditorContainer>
          </HideTablet>
        </OuterFormTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
