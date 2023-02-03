import React, { FunctionComponent } from 'react';
import Editor from '@monaco-editor/react';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';

import { EditorStyles } from '../styled-components';
interface GeneratePDFModalProps {
  payloadData: string;
  setPayload: (payload: string) => void;
}
export const GeneratePDF: FunctionComponent<GeneratePDFModalProps> = ({ payloadData, setPayload }) => {
  return (
    <>
      <GoAForm>
        <GoAFormItem>
          <EditorStyles>
            <Editor
              data-testid="form-schema"
              height={150}
              value={payloadData}
              onChange={(value) => setPayload(value)}
              language="json"
              options={{
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                minimap: { enabled: false },
              }}
            />
          </EditorStyles>
        </GoAFormItem>
      </GoAForm>
    </>
  );
};
