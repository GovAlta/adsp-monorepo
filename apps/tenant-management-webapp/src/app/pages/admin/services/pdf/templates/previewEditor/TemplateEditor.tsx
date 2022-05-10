import React, { FunctionComponent, useEffect, useState } from 'react';
import { TemplateEditorContainer, EditTemplateActions, MonacoDivBody } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { GoARadio, GoARadioGroup } from '@abgov/react-components';
import { GoAButton } from '@abgov/react-components';

interface TemplateEditorProps {
  modelOpen: boolean;
  mainTitle: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string, channel: string) => void;
  setPreview: (channel: string) => void;
  template: PdfTemplate;
  bodyTitle: string;
  bodyEditorConfig?: EditorProps;
  saveCurrentTemplate?: (useWrapper: boolean) => void;
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

  const [htmlType, setHtmlType] = useState('Html');

  useEffect(() => {
    setPreview(template?.useWrapper ? 'Snippet' : 'Html');
    setHtmlType(template?.useWrapper ? 'Snippet' : 'Html');
  }, [template]);

  let radioOptions = [];

  const validChannels = ['Html', 'Snippet'];

  radioOptions = validChannels.map((eventKey, index) => {
    return {
      name: eventKey,
      display: eventKey,
      body: template?.template,
      label: eventKey,
      key: index,
      dataTestId: `${eventKey}-radio-button`,
    };
  });

  const item = radioOptions.find((channel) => channel.name === htmlType);

  return (
    <TemplateEditorContainer>
      <GoAForm>
        <GoAFormItem>
          <GoARadioGroup
            name="status"
            value={htmlType}
            onChange={(_name, value) => {
              setHtmlType(value);
              setPreview(value);
            }}
            orientation="horizontal"
          >
            {radioOptions.map((item, key) => (
              <GoARadio key={key} value={item.name}>
                {item.display}
              </GoARadio>
            ))}
          </GoARadioGroup>

          <h3 data-testid="modal-title">{`${mainTitle} template`}</h3>

          <>
            <GoAFormItem error={errors['body'] ?? ''} helpText={''}>
              <MonacoDivBody>
                <MonacoEditor
                  language={'handlebars'}
                  value={item.body}
                  onChange={(value) => {
                    onBodyChange(value, item.name);
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
            data-testid="template-form-cancel"
            buttonType="secondary"
            type="button"
          >
            Cancel
          </GoAButton>
          <GoAButton
            onClick={() => saveCurrentTemplate(htmlType === 'Snippet')}
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
