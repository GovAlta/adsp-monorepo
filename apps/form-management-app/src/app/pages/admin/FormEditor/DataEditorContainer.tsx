import React, { useRef, useState } from 'react';
import styles from './Editor.module.scss';
import { isValidJSONSchemaCheck } from '../../../utils/checkInput';
import { useWindowDimensions } from '../../../utils/useWindowDimensions';
import { GoAFormItem } from '@abgov/react-components';
import MonacoEditor from '@monaco-editor/react';
import { JsonSchema } from '@jsonforms/core';

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
}

export const DataEditorContainer: React.FC<DataEditorContainerProps> = ({
  errors,
  editorErrors,
  tempDataSchema,
  setDraftDataSchema,
  setEditorErrors,
}): JSX.Element => {
  const JSONSchemaValidator = isValidJSONSchemaCheck('Data schema');
  const editorRefData = useRef(null);
  const [dataEditorLocation, setDataEditorLocation] = useState<number>(0);
  const { height } = useWindowDimensions();
  const EditorHeight = height - 400;
  const isUseMiniMap = window.screen.availWidth >= 1920;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMountData = (editor: any) => {
    editorRefData.current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(dataEditorLocation);
      }, 5);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.onDidScrollChange((e: any) => {
      setDataEditorLocation(e.scrollTop);
    });
  };

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
