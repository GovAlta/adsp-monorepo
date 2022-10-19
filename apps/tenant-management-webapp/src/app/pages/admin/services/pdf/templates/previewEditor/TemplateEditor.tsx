import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  TemplateEditorContainerPdf,
  EditTemplateActions,
  MonacoDivBody,
  MonacoDivHeader,
  MonacoDivFooter,
  PdfEditorLabelWrapper,
} from './styled-components';
import { GoAForm, GoAFormItem, GoABadge } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { GoAButton } from '@abgov/react-components';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { PDFConfigForm } from './PDFConfigForm';

interface TemplateEditorProps {
  modelOpen: boolean;
  mainTitle: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string) => void;
  onHeaderChange: (value: string) => void;
  onFooterChange: (value: string) => void;
  setPreview: (channel: string) => void;
  bodyEditorHintText?: string;
  template: PdfTemplate;
  savedTemplate: PdfTemplate;
  bodyTitle: string;
  bodyEditorConfig?: EditorProps;
  saveCurrentTemplate?: () => void;
  // eslint-disable-next-line
  errors?: any;
  // eslint-disable-next-line
  suggestion?: any;
  cancel: () => void;
  updateTemplate: (template: PdfTemplate) => void;
  validateEventTemplateFields: () => boolean;
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
  savedTemplate,
  bodyTitle,
  bodyEditorConfig,
  saveCurrentTemplate,
  errors,
  suggestion,
  cancel,
  updateTemplate,
  validateEventTemplateFields,
}) => {
  const monaco = useMonaco();
  const [saveModal, setSaveModal] = useState(false);
  const [hasConfigError, setHasConfigError] = useState(false);

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
  const tmpTemplate = template;
  const resetSavedAction = () => {
    onBodyChange(savedTemplate.template);
    onHeaderChange(savedTemplate.header);
    onFooterChange(savedTemplate.footer);
  };

  return (
    <TemplateEditorContainerPdf>
      {template && (
        <PDFConfigForm
          template={template}
          setError={(hasError) => {
            setHasConfigError(hasError);
          }}
          onChange={(_template) => {
            updateTemplate({ ..._template });
          }}
        />
      )}
      <GoAForm>
        <GoAFormItem>
          <Tabs
            activeIndex={activeIndex}
            changeTabCallback={(index: number) => {
              switchTabPreview(channels[index]);
              updateTemplate(tmpTemplate);
            }}
          >
            <Tab
              testId={`pdf-edit-header-footer`}
              label={
                <PdfEditorLabelWrapper>
                  Header/Footer{' '}
                  <div className="badge">
                    {(errors?.footer || errors?.header) && (
                      <GoABadge key="header-xss-error-badge" type="emergency" content="XSS Error" icon="warning" />
                    )}
                  </div>
                </PdfEditorLabelWrapper>
              }
            >
              <>
                <GoAFormItem error={errors?.header ?? ''}>
                  <div className="title">Header</div>
                  <MonacoDivHeader>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.header}
                      onChange={(value) => {
                        onHeaderChange(value);
                        if (tmpTemplate) {
                          tmpTemplate.header = value;
                        }
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivHeader>
                </GoAFormItem>
              </>
              <>
                <GoAFormItem error={errors?.footer ?? ''}>
                  <div className="title">Footer</div>
                  <MonacoDivFooter>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.footer}
                      onChange={(value) => {
                        onFooterChange(value);
                        if (tmpTemplate) {
                          tmpTemplate.footer = value;
                        }
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivFooter>
                </GoAFormItem>
              </>
            </Tab>

            <Tab
              testId={`pdf-edit-body`}
              label={
                <PdfEditorLabelWrapper>
                  Body
                  <div className="badge">
                    {errors?.body && (
                      <GoABadge key="header-xss-error-badge" type="emergency" content="XSS Error" icon="warning" />
                    )}
                  </div>
                </PdfEditorLabelWrapper>
              }
            >
              <>
                <GoAFormItem error={errors?.body ?? null} helpText={bodyEditorHintText}>
                  <div className="title">Body</div>
                  <MonacoDivBody>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.template}
                      onChange={(value) => {
                        onBodyChange(value);
                        if (tmpTemplate) {
                          tmpTemplate.template = value;
                        }
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivBody>
                </GoAFormItem>
              </>
            </Tab>
          </Tabs>
        </GoAFormItem>
        <EditTemplateActions>
          {' '}
          <GoAButton
            onClick={() => {
              if (
                savedTemplate.template !== template.template ||
                savedTemplate.header !== template.header ||
                savedTemplate.footer !== template.footer
              ) {
                setSaveModal(true);
              } else {
                cancel();
              }
            }}
            data-testid="template-form-close"
            buttonType="secondary"
            type="button"
          >
            Close
          </GoAButton>
          <GoAButton
            disabled={!validateEventTemplateFields() || hasConfigError}
            onClick={() => saveCurrentTemplate()}
            buttonType="primary"
            data-testid="template-form-save"
            type="submit"
          >
            Save
          </GoAButton>
        </EditTemplateActions>
      </GoAForm>
      <SaveFormModal
        open={saveModal}
        onDontSave={() => {
          setSaveModal(false);
          resetSavedAction();
          cancel();
        }}
        onSave={() => {
          saveCurrentTemplate();
          setSaveModal(false);
        }}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainerPdf>
  );
};
