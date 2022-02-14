import React, { FunctionComponent } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps } from '@monaco-editor/react';

interface TemplateEditorProps {
  mainTitle: string;
  onSubjectChange: (value: string) => void;
  subject: string;
  subjectEditorHintText?: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string) => void;
  body: string;
  bodyTitle: string;
  bodyEditorConfig?: EditorProps;
  bodyEditorHintText?: string;
  actionButtons?: JSX.Element;
}

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  mainTitle,
  onSubjectChange,
  subject,
  subjectEditorHintText,
  subjectTitle,
  subjectEditorConfig,
  onBodyChange,
  body,
  bodyTitle,
  bodyEditorConfig,
  bodyEditorHintText,
  actionButtons,
}) => {
  return (
    <TemplateEditorContainer>
      <h3 data-testid="modal-title">{mainTitle}</h3>
      <GoAForm>
        <h4>{subjectTitle}</h4>
        <GoAFormItem helpText={subjectEditorHintText}>
          <MonacoDiv>
            <MonacoEditor
              onChange={(value) => {
                onSubjectChange(value);
              }}
              value={subject}
              {...subjectEditorConfig}
            />
          </MonacoDiv>
        </GoAFormItem>
        <h4>{bodyTitle}</h4>
        <GoAFormItem helpText={bodyEditorHintText}>
          <MonacoDiv>
            <MonacoEditor
              value={body}
              onChange={(value) => {
                onBodyChange(value);
              }}
              {...bodyEditorConfig}
            />
          </MonacoDiv>
        </GoAFormItem>
        <EditTemplateActions>{actionButtons}</EditTemplateActions>
      </GoAForm>
    </TemplateEditorContainer>
  );
};
