import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { NameDescriptionDataSchema, EditorPadding } from './styled-components';
import { isValidJSONSchemaCheck } from '../../../components/checkInput';
import { useWindowDimensions } from '../../../components/useWindowDimensions';
import { GoAFormItem } from '@abgov/react-components';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';

export interface UiEditorContainerProps {
  errors: Record<string, string | null>;
  editorErrors: {
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  };
  tempUiSchema: any;
  setDraftUiSchema: (schema: any) => void;
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

  const EditorHeight = height - 400;

  const isUseMiniMap = window.screen.availWidth >= 1920;
  const handleEditorDidMountUi = (editor) => {
    editorRefData.current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(dataEditorLocation);
      }, 5);
    });

    editor.onDidScrollChange((e) => {
      setDataEditorLocation(e.scrollTop);
    });
  };

  return (
    <AdminLayout>
      <Main>
        <GoAFormItem
          error={errors?.body ?? editorErrors?.dataSchemaJSON ?? editorErrors?.dataSchemaJSONSchema ?? null}
          label=""
        >
          <EditorPadding>
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
                setDraftUiSchema(value);
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
          </EditorPadding>
        </GoAFormItem>
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
