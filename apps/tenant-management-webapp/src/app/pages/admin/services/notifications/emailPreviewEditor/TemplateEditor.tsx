import React, { FunctionComponent, useEffect } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
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
  // eslint-disable-next-line
  errors?: any;
  serviceName?: string;
  // eslint-disable-next-line
  eventSuggestion?: any;
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
  eventSuggestion,
}) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerCompletionItemProvider('handlebars', {
        triggerCharacters: ['{{', '.'],
        provideCompletionItems: (model, position) => {
          const suggestions = buildSuggestions(monaco, eventSuggestion, model, position);
          return {
            suggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });
      return function cleanup() {
        provider.dispose();
      };
    }
  }, [monaco, eventSuggestion]);

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
