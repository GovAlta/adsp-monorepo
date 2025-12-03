import React, { useState, useRef } from 'react';
import styles from './Editor.module.scss';
import { DataEditorContainer } from './DataEditorContainer';
import { UIEditorContainer } from './UiEditorContainer';
import { useValidators } from './useValidators';
import { badCharsCheck, isNotEmptyCheck, wordMaxLengthCheck } from '../../../utils/checkInput';
import type * as monacoNS from 'monaco-editor';
import { Preview } from './Preview';
import { FormDefinition } from '../../../state/types';
import { SubmitButtonsBar } from './SubmitButtonsBar';
import { GoATabs, GoATab } from '@abgov/react-components';
import { RegisterData } from '../../../../../../../libs/jsonforms-components/src';
import { UISchemaElement } from '@jsonforms/core';
import { FileMetadata, FileWithMetadata } from '../../../state/file/file.slice';

type IEditor = monacoNS.editor.IStandaloneCodeEditor;

export interface EditorProps {
  definition: FormDefinition;
  setDraftDataSchema: (definition: string) => void;
  setDraftUiSchema: (definition: string) => void;
  isFormUpdated: boolean;
  updateFormDefinition: () => void;
  resolvedDataSchema: Record<string, unknown>;
  fileList: Record<string, FileMetadata[]>;
  uploadFile: (file: FileWithMetadata, propertyId: string) => void;
  downloadFile: (file: FileWithMetadata) => void;
  deleteFile: (file: FileWithMetadata) => void;
  formServiceApiUrl: string;
  schemaError: string | null;
  uiSchema: UISchemaElement;
  registerData: RegisterData;
  nonAnonymous: string[];
  dataList: string[];
}

export const Editor: React.FC<EditorProps> = ({
  definition,
  setDraftDataSchema,
  setDraftUiSchema,
  updateFormDefinition,
  isFormUpdated,
  resolvedDataSchema,
  fileList,
  uploadFile,
  downloadFile,
  deleteFile,
  formServiceApiUrl,
  schemaError,
  uiSchema,
  registerData,
  nonAnonymous,
  dataList,
}) => {
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const editorRefData = useRef(null);
  const editorRefUi = useRef(null);

  const [editorErrors, setEditorErrors] = useState<{
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  }>({
    uiSchema: null,
    dataSchemaJSON: null,
    dataSchemaJSONSchema: null,
  });

  function foldAll(editor: IEditor) {
    editor.trigger('folding-util', 'editor.foldAll', undefined);
  }
  function unfoldAll(editor: IEditor) {
    editor.trigger('folding-util', 'editor.unfoldAll', undefined);
  }

  const getCurrentEditorRef = () => {
    if (activeIndex === 0) return editorRefData.current; // Data schema tab
    if (activeIndex === 1) return editorRefUi.current; // UI schema tab
    return null;
  };

  if (!definition) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles['form-editor']}>
      <div className={styles['name-description-data-schema']}>
        <div className={styles['form-editor-title']}>Form / Definition Editor</div>
        <hr className={styles['hr-resize']} />
        <GoATabs data-testid="form-editor-tabs">
          <GoATab heading="Data schema" data-testid="dcm-form-editor-data-schema-tab">
            <DataEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempDataSchema={definition?.dataSchema}
              setDraftDataSchema={setDraftDataSchema}
              setEditorErrors={setEditorErrors}
            />
          </GoATab>
          <GoATab heading="UI schema" data-testid="dcm-form-editor-ui-schema-tab">
            <UIEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempUiSchema={definition?.uiSchema}
              setDraftUiSchema={setDraftUiSchema}
              setEditorErrors={setEditorErrors}
            />
          </GoATab>
        </GoATabs>
        <SubmitButtonsBar
          getCurrentEditorRef={getCurrentEditorRef}
          activeIndex={activeIndex}
          editorErrors={editorErrors}
          definition={definition}
          updateFormDefinition={updateFormDefinition}
          foldAll={foldAll}
          unfoldAll={unfoldAll}
          isFormUpdated={isFormUpdated}
          validators={validators}
        />
      </div>
      <div className={styles['preview-pane']}>
        <Preview
          fileList={fileList}
          uploadFile={uploadFile}
          downloadFile={downloadFile}
          deleteFile={deleteFile}
          formServiceApiUrl={formServiceApiUrl}
          schemaError={schemaError}
          definition={definition}
          dataSchema={resolvedDataSchema}
          uiSchema={uiSchema}
          registerData={registerData}
          nonAnonymous={nonAnonymous}
          dataList={dataList}
        />
      </div>
    </div>
  );
};
