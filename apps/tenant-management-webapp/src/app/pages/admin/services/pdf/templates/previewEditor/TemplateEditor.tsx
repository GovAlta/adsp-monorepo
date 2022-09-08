import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  TemplateEditorContainerPdf,
  EditTemplateActions,
  MonacoDivBody,
  MonacoDivHeader,
  MonacoDivFooter,
} from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { GoAButton } from '@abgov/react-components';
import { Tab, Tabs } from '@components/Tabs';

interface TemplateEditorProps {
  modelOpen: boolean;
  mainTitle: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string) => void;
  onHeaderChange: (value: string) => void;
  onFooterChange: (value: string) => void;
  setPreview: (channel: string) => void;
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
  onHeaderChange,
  onFooterChange,
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

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setPreview('main');
    onHeaderChange(template?.header);
    onFooterChange(template?.footer);
  }, [template, modelOpen]);

  const switchTabPreview = (value) => {
    onHeaderChange(template?.header);
    onFooterChange(template?.footer);
    setPreview(value);
  };

  useEffect(() => {
    if (modelOpen) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [modelOpen]);

  const channels = ['main', 'footer/header'];

  return (
    <TemplateEditorContainerPdf>
      <GoAForm>
        <GoAFormItem>
          <Tabs activeIndex={activeIndex} changeTabCallback={(index: number) => switchTabPreview(channels[index])}>
            <Tab label="Main">
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
            </Tab>
            <Tab label="Header/Footer">
              <h3 className="reduce-margin" data-testid="modal-title">
                {`${template?.name}`}
                <p>{`${mainTitle} template`}</p>
              </h3>

              <>
                <GoAFormItem error={errors?.body ?? ''}>
                  <h4>Header</h4>
                  <MonacoDivHeader>
                    <MonacoEditor
                      language={'handlebars'}
                      value={template?.header}
                      onChange={(value) => {
                        onHeaderChange(value);
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivHeader>
                </GoAFormItem>
              </>
              <>
                <GoAFormItem error={errors?.body ?? ''} helpText={bodyEditorHintText}>
                  <h4>Footer</h4>
                  <MonacoDivFooter>
                    <MonacoEditor
                      language={'handlebars'}
                      value={template?.footer}
                      onChange={(value) => {
                        onFooterChange(value);
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivFooter>
                </GoAFormItem>
              </>
            </Tab>
          </Tabs>
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
    </TemplateEditorContainerPdf>
  );
};
