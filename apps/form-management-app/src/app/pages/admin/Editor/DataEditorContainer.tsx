import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { NameDescriptionDataSchema, EditorPadding } from './styled-components';
import { isValidJSONSchemaCheck } from '../../../components/checkInput'
import { useWindowDimensions } from '../../../components/useWindowDimensions';
import { GoAFormItem } from '@abgov/react-components';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';

export const DataEditorContainer = ({
  errors,
  editorErrors,
  tempDataSchema,
  setDraftDataSchema,
  setEditorErrors
}): JSX.Element => {
  const JSONSchemaValidator = isValidJSONSchemaCheck('Data schema');

  const editorRefData = useRef(null);

  const [dataEditorLocation, setDataEditorLocation] = useState<number>(0);

  const { height } = useWindowDimensions();

  const EditorHeight = height - 400;

  const isUseMiniMap = window.screen.availWidth >= 1920;

  const handleEditorDidMountData = (editor) => {
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
        <h2>Welcome to Data Container</h2>
        <GoAFormItem
          error={errors?.body ?? editorErrors?.dataSchemaJSON ?? editorErrors?.dataSchemaJSONSchema ?? null}
          label=""
        >
          <EditorPadding>
            <MonacoEditor
              data-testid="form-data-schema"
              height={EditorHeight}
              value={tempDataSchema}
              onMount={handleEditorDidMountData}
              onChange={(value) => {
                const jsonSchemaValidResult = JSONSchemaValidator(value);
                //dispatch(setDraftDataSchema(value));
                setDraftDataSchema(value);

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
