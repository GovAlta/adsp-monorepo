import React, { FunctionComponent, useEffect } from 'react';
import { TemplateEditorContainer, EditTemplateActions, MonacoDivBody } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { GoAButton } from '@abgov/react-components';

interface TemplateEditorProps {
  modelOpen: boolean;
  mainTitle: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string) => void;
  setPreview: () => void;
  bodyEditorHintText: string;
  template: PdfTemplate;
  bodyTitle: string;
  bodyEditorConfig?: EditorProps;
  saveCurrentTemplate?: () => void;
  errors?: any;
  suggestion?: any;
  cancel: () => void;
}

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  modelOpen,
  mainTitle,
  subjectTitle,
  subjectEditorConfig,
  onBodyChange,
  setPreview,
  bodyEditorHintText,
  template,
  bodyTitle,
  bodyEditorConfig,
  saveCurrentTemplate,
  errors,
  suggestion,
  cancel,
}) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerCompletionItemProvider('handlebars', {
        triggerCharacters: ['{{', '.'],
        provideCompletionItems: (model, position) => {
          const suggestions = buildSuggestions(monaco, suggestion, model, position);
          return {
            suggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });
      return function cleanup() {
        provider.dispose();
      };
    }
  }, [monaco, suggestion]);

  useEffect(() => {
    setPreview();
  }, [template, modelOpen]);

  return (
    <TemplateEditorContainer>
      <GoAForm>
        <GoAFormItem>
          <h3 className="reduce-margin" data-testid="modal-title">
            {`${template?.name}`}
            <p>{`${mainTitle} template`}</p>
          </h3>

          <>
            <GoAFormItem error={errors?.body ?? ''} helpText={bodyEditorHintText}>
              <MonacoDivBody>
                <MonacoEditor
                  language={'handlebars'}
                  value={template?.template}
                  onChange={(value) => {
                    onBodyChange(value);
                  }}
                  {...bodyEditorConfig}
                />
              </MonacoDivBody>
            </GoAFormItem>
          </>
        </GoAFormItem>
        <EditTemplateActions>
          {' '}
          <GoAButton
            onClick={() => {
              cancel();
            }}
            data-testid="template-form-close"
            buttonType="secondary"
            type="button"
          >
            Cancel
          </GoAButton>
          <GoAButton
            onClick={() => saveCurrentTemplate()}
            buttonType="primary"
            data-testid="template-form-save"
            type="submit"
          >
            Save
          </GoAButton>
        </EditTemplateActions>
      </GoAForm>
    </TemplateEditorContainer>
  );
};
