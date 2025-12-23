import React, { useRef, useState } from 'react';
import styles from './Editor.module.scss';
import { useWindowDimensions } from '../../../utils/useWindowDimensions';
import { GoabFormItem } from '@abgov/react-components';
import MonacoEditor from '@monaco-editor/react';
import { JsonSchema } from '@jsonforms/core';

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
}

export const UIEditorContainer: React.FC<UiEditorContainerProps> = ({
  errors,
  editorErrors,
  tempUiSchema,
  setDraftUiSchema,
  setEditorErrors,
}): JSX.Element => {
  const editorRefData = useRef(null);

  const [dataEditorLocation, setDataEditorLocation] = useState<number>(0);

  const { height } = useWindowDimensions();

  const EditorHeight = height - 180;

  const isUseMiniMap = window.screen.availWidth >= 1920;
  interface EditorScrollEvent {
    scrollTop: number;
  }

  interface EditorInstance {
    setScrollTop(scrollTop: number): void;
    onDidScrollChange(listener: (e: EditorScrollEvent) => void): void;
  }

  const handleEditorDidMountUi = (editor: EditorInstance): void => {
    (editorRefData as React.MutableRefObject<EditorInstance | null>).current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(dataEditorLocation);
      }, 5);
    });

    editor.onDidScrollChange((e: EditorScrollEvent) => {
      setDataEditorLocation(e.scrollTop);
    });
  };

  return (
    <GoabFormItem
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
    </GoabFormItem>
  );
};
