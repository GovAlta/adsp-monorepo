import React from 'react';
import styles from './Editor.module.scss';
import { isValidJSONSchemaCheck } from '../../../utils/checkInput';
import { useWindowDimensions } from '../../../utils/useWindowDimensions';
import { GoAFormItem } from '@abgov/react-components';
import MonacoEditor from '@monaco-editor/react';
import { JsonSchema } from '@jsonforms/core';
import type * as monacoNS from 'monaco-editor';

export interface DataEditorContainerProps {
  errors: Record<string, string | null>; // From useValidators()
  editorErrors: {
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  };

  tempDataSchema: JsonSchema;
  setDraftDataSchema: (schema: string) => void;
  setEditorErrors: React.Dispatch<
    React.SetStateAction<{
      uiSchema: string | null;
      dataSchemaJSON: string | null;
      dataSchemaJSONSchema: string | null;
    }>
  >;
  handleEditorDidMountData: (editor: monacoNS.editor.IStandaloneCodeEditor) => void;
}

export const DataEditorContainer: React.FC<DataEditorContainerProps> = ({
  errors,
  editorErrors,
  tempDataSchema,
  setDraftDataSchema,
  setEditorErrors,
  handleEditorDidMountData,
}): JSX.Element => {
  const JSONSchemaValidator = isValidJSONSchemaCheck('Data schema');
  const { height } = useWindowDimensions();
  const EditorHeight = height - 180;
  const isUseMiniMap = window.screen.availWidth >= 1920;

  return (
    <div>
      <GoAFormItem
        error={errors?.body ?? editorErrors?.dataSchemaJSON ?? editorErrors?.dataSchemaJSONSchema ?? null}
        label=""
      >
        <div className={styles['editor-padding']}>
          <MonacoEditor
            data-testid="form-data-schema"
            height={EditorHeight}
            value={JSON.stringify(tempDataSchema, null, 2)}
            onMount={handleEditorDidMountData}
            onChange={(value) => {
              const jsonSchemaValidResult = JSONSchemaValidator(value);
              setDraftDataSchema(value || '');

              if (jsonSchemaValidResult === '') {
                setEditorErrors({
                  ...editorErrors,
                  dataSchemaJSONSchema: null,
                });
              } else {
                setEditorErrors({
                  ...editorErrors,
                  dataSchemaJSONSchema: jsonSchemaValidResult,
                });
              }
            }}
            onValidate={(makers) => {
              if (makers.length === 0) {
                setEditorErrors({
                  ...editorErrors,
                  dataSchemaJSON: null,
                });
                return;
              }
              setEditorErrors({
                ...editorErrors,
                dataSchemaJSON: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
              });
            }}
            language="json"
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              lineNumbersMinChars: 2,
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
    </div>
  );
};
