import React, { useRef, useState } from 'react';
import styles from './Editor.module.scss';
import { useWindowDimensions } from '../../../utils/useWindowDimensions';
import { GoAFormItem } from '@abgov/react-components';
import MonacoEditor from '@monaco-editor/react';
import { JsonSchema } from '@jsonforms/core';
import type * as monaco from 'monaco-editor';

export interface EditorScrollEvent {
  scrollTop: number;
}

export interface EditorInstance {
  setScrollTop(scrollTop: number): void;
  onDidScrollChange(listener: (e: EditorScrollEvent) => void): void;
}

export interface UiEditorContainerProps {
  errors: Record<string, string | null>;
  editorErrors: {
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  };
  tempUiSchema: JsonSchema;
  setDraftUiSchema: (schema: string) => void;
  setEditorErrors: React.Dispatch<
    React.SetStateAction<{
      uiSchema: string | null;
      dataSchemaJSON: string | null;
      dataSchemaJSONSchema: string | null;
    }>
  >;
  handleEditorDidMountUi: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

export const UIEditorContainer: React.FC<UiEditorContainerProps> = ({
  errors,
  editorErrors,
  tempUiSchema,
  setDraftUiSchema,
  setEditorErrors,
  handleEditorDidMountUi,
}): JSX.Element => {
  const { height } = useWindowDimensions();

  const EditorHeight = height - 180;

  const isUseMiniMap = window.screen.availWidth >= 1920;

  return (
    <GoAFormItem
      error={errors?.body ?? editorErrors?.dataSchemaJSON ?? editorErrors?.dataSchemaJSONSchema ?? null}
      label=""
    >
      <div className={styles['editor-padding']}>
        <MonacoEditor
          data-testid="form-ui-schema"
          height={EditorHeight}
          value={JSON.stringify(tempUiSchema, null, 2)}
          onValidate={(makers) => {
            if (makers.length === 0) {
              setEditorErrors({
                ...editorErrors,
                uiSchema: null,
              });
              return;
            }
            setEditorErrors({
              ...editorErrors,
              uiSchema: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
            });
          }}
          onMount={handleEditorDidMountUi}
          onChange={(value) => {
            setDraftUiSchema(value || '');
          }}
          language="json"
          options={{
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            padding: {
              top: 8,
            },
            minimap: { enabled: isUseMiniMap },
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
          }}
        />
      </div>
    </GoAFormItem>
  );
};
