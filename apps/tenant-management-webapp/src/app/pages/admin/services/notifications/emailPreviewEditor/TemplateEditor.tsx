<<<<<<< HEAD
import React, { FunctionComponent } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions } from './styled-components';
=======
import React, { FunctionComponent, useEffect } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions, MonacoDivBody } from './styled-components';
>>>>>>> cc6fa8e8f47335d5e8ab6c5d259e53c6c9acf661
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
  errors?: any;
  serviceName?: string;
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
  errors,
  serviceName,
}) => {
  return (
    <TemplateEditorContainer>
      <h3 data-testid="modal-title">{`${mainTitle}--${serviceName}`}</h3>
      <GoAForm>
        <h4>{subjectTitle}</h4>
        <GoAFormItem error={errors['subject'] ?? ''} helpText={subjectEditorHintText}>
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
        <GoAFormItem error={errors['body'] ?? ''} helpText={bodyEditorHintText}>
          <MonacoDivBody>
            <MonacoEditor
              value={body}
              onChange={(value) => {
                onBodyChange(value);
              }}
              {...bodyEditorConfig}
            />
          </MonacoDivBody>
        </GoAFormItem>
        <EditTemplateActions>{actionButtons}</EditTemplateActions>
      </GoAForm>
    </TemplateEditorContainer>
  );
};
