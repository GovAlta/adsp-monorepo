import React, { useState, useRef, useEffect } from 'react';
import './Editor.scss';
import { Tab, Tabs } from '../../../components/Tabs';
import { DataEditorContainer } from './DataEditorContainer';
import { UIEditorContainer } from './UiEditorContainer';
import {
  FormDataSchemaElementCompletionItemProvider,
  FormPropertyValueCompletionItemProvider,
  FormUISchemaElementCompletionItemProvider,
} from '../../../utils/autoComplete';
import { useMonaco } from '@monaco-editor/react';
import { useValidators } from './useValidators';
import { badCharsCheck, isNotEmptyCheck, wordMaxLengthCheck } from '../../../components/checkInput';
import type * as monacoNS from 'monaco-editor';

import { FormDefinition } from '../../../state/types';
import { Buttons } from './Button';

type IEditor = monacoNS.editor.IStandaloneCodeEditor;

export interface EditorProps {
  definition: FormDefinition;
  setDraftDataSchema: (definition: string) => void;
  setDraftUiSchema: (definition: string) => void;
  isFormUpdated: boolean;
  updateFormDefinition: (form: FormDefinition) => void;
  resolvedDataSchema: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}

export const Editor: React.FC<EditorProps> = ({
  definition,
  setDraftDataSchema,
  setDraftUiSchema,
  updateFormDefinition,
  isFormUpdated,
  resolvedDataSchema,
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

  const monaco = useMonaco();

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

  useEffect(() => {
    if (monaco) {
      const valueProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormPropertyValueCompletionItemProvider(resolvedDataSchema)
      );

      const uiElementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormUISchemaElementCompletionItemProvider(resolvedDataSchema)
      );

      const dataElementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormDataSchemaElementCompletionItemProvider()
      );

      return function () {
        valueProvider.dispose();
        uiElementProvider.dispose();
        dataElementProvider.dispose();
      };
    }
  }, [monaco, resolvedDataSchema]);

  if (!definition) {
    return <div>Loading...</div>;
  }

  return (
    <div className="form-editor">
      <div className="name-description-data-schema">
        <div className="form-editor-title">Form / Definition Editor</div>
        <hr className="hr-resize" />
        <Tabs activeIndex={activeIndex} data-testid="form-editor-tabs">
          <Tab label="Data schema" data-testid="dcm-form-editor-data-schema-tab">
            <DataEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempDataSchema={definition?.dataSchema}
              setDraftDataSchema={setDraftDataSchema}
              setEditorErrors={setEditorErrors}
            />
          </Tab>
          <Tab label="UI schema" data-testid="dcm-form-editor-ui-schema-tab">
            <UIEditorContainer
              errors={errors}
              editorErrors={editorErrors}
              tempUiSchema={definition?.uiSchema}
              setDraftUiSchema={setDraftUiSchema}
              setEditorErrors={setEditorErrors}
            />
          </Tab>
        </Tabs>

        <Buttons
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
      <div className="form-preview-container"></div>
    </div>
  );
};