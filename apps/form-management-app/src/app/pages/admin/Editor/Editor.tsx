import React, { useState } from 'react';
import styled from 'styled-components';
import { Tab, Tabs } from '../../../components/Tabs';
import {DataEditorContainer } from './DataEditorContainer';
import { UIEditorContainer} from './UiEditorContainer';
import { NameDescriptionDataSchema, EditorPadding, FormEditorTitle } from './styled-components';
import { useValidators } from '../../../components/useValidators';
import { badCharsCheck, isNotEmptyCheck, wordMaxLengthCheck } from '../../../components/checkInput';
import { editor } from 'monaco-editor';
import { FormDefinition } from '../../../state/form.slice';



//   const getQueueTaskToProcessValue = () => {
//     let value = NO_TASK_CREATED_OPTION;

//     if (definition.queueTaskToProcess) {
//       const { queueNameSpace, queueName } = definition.queueTaskToProcess;
//       if (queueNameSpace !== '' && queueName !== '') {
//         value = `${queueNameSpace}:${queueName}`;
//       } else {
//         value = NO_TASK_CREATED_OPTION;
//       }
//     }

//     return value;
//   };

export interface EditorProps {
  definition: FormDefinition;
}

export const Editor: React.FC<EditorProps> = ({ definition, setDraftDataSchema }) => {

    const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
    )
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const [editorErrors, setEditorErrors] = useState({
    uiSchema: null,
    dataSchemaJSON: null,
    dataSchemaJSONSchema: null,
  });

  if (!definition) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <Main>
        <h2>Welcome to editor</h2>
        <FormEditorTitle>Form / Definition Editor</FormEditorTitle>
        <Tabs data-testid="form-editor-tabs">
          <Tab label="Data schema" data-testid="dcm-form-editor-data-schema-tab">
            <DataEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempDataSchema={definition.dataSchema}
              setDraftDataSchema={setDraftDataSchema}
              setEditorErrors={setEditorErrors}
            />
          </Tab>
          <Tab label="UI schema" data-testid="dcm-form-editor-ui-schema-tab">
            <UIEditorContainer />
          </Tab>
        </Tabs>
      </Main>
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
