import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { FormTemplateEditorContainer } from './styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, AppState } from '../../../state';
import {
  updateDefinition,
  openEditorForDefinition,

} from '../../../state/form/form.slice';
import { isFormUpdatedSelector } from '../../../state/form/selectors';

import { Editor } from './Editor';
import { modifiedDefinitionSelector } from '../../../state/form/selectors';
import { setDraftDataSchema, setDraftUiSchema } from '../../../state/form/form.slice';

const EditorWrapper = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch<AppDispatch>();

  const selectedId = useSelector((state: AppState) => state.form.editor.selectedId);

  useEffect(() => {
    try {
      if (id && id !== selectedId) {
        dispatch(openEditorForDefinition({ id }));
      }
    } catch (e) {
      console.error('ggggggggg:' + JSON.stringify(e));
    }
  }, [id, selectedId, dispatch]);

  const { isFormUpdated } = useSelector((state: AppState) => ({
    isFormUpdated: isFormUpdatedSelector(state),
  }));

  const updateFormDefinition = (definition) => {
    dispatch(updateDefinition(definition));
  };

  const definition = useSelector(modifiedDefinitionSelector);

  const setDraftData = (definition: string) => {
    dispatch(setDraftDataSchema(definition));
  };
  const setDraftUi = (definition: string) => {
    dispatch(setDraftUiSchema(definition));
  };

  const resolvedDataSchema = useSelector((state: AppState) => state.form.editor.resolvedDataSchema) as Record<
    string,
    unknown
  >;

  return (
    <AdminLayout>
      <FormTemplateEditorContainer>
        {definition?.id && (
          <Editor
            updateFormDefinition={updateFormDefinition}
            definition={definition}
            setDraftDataSchema={setDraftData}
            setDraftUiSchema={setDraftUi}
            isFormUpdated={isFormUpdated}
            resolvedDataSchema={resolvedDataSchema}
          />
        )}
      </FormTemplateEditorContainer>
    </AdminLayout>
  );
};

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;

const AdminLayout = styled.div`
  display: flex;
`;

export default EditorWrapper
