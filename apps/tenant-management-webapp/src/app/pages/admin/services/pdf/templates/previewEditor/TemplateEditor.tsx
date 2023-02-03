import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  TemplateEditorContainerPdf,
  EditTemplateActions,
  MonacoDivBody,
  MonacoDivHeader,
  MonacoDivFooter,
  PdfEditorLabelWrapper,
  PdfEditActionLayout,
  PdfEditActions,
  GeneratorStyling,
  GenerateButtonPadding,
  SpinnerPadding,
  SpinnerSpace,
} from '../../styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions, triggerInScope } from '@lib/autoComplete';
import { GoAButton } from '@abgov/react-components-new';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { PDFConfigForm } from './PDFConfigForm';
import { getSuggestion } from '../utils/suggestion';
import { bodyEditorConfig } from './config';
import { generatePdf } from '@store/pdf/action';
import { useDispatch } from 'react-redux';
import GeneratedPdfList from '../../testGenerate/generatedPdfList';
import { GeneratePDF } from '../../testGenerate/generatePDF';
import { GoAElementLoader } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
interface TemplateEditorProps {
  modelOpen: boolean;
  onBodyChange: (value: string) => void;
  onHeaderChange: (value: string) => void;
  onFooterChange: (value: string) => void;
  setPreview: (channel: string) => void;

  template: PdfTemplate;
  savedTemplate: PdfTemplate;
  saveCurrentTemplate?: () => void;
  // eslint-disable-next-line
  errors?: any;
  // eslint-disable-next-line
  cancel: () => void;
  updateTemplate: (template: PdfTemplate) => void;
}

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  modelOpen,
  onBodyChange,
  onHeaderChange,
  onFooterChange,
  setPreview,
  template,
  savedTemplate,
  saveCurrentTemplate,
  errors,
  cancel,
  updateTemplate,
}) => {
  const monaco = useMonaco();
  const [saveModal, setSaveModal] = useState(false);
  const [hasConfigError, setHasConfigError] = useState(false);
  const [variables, setVariables] = useState('{}');
  const suggestion = template ? getSuggestion() : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerCompletionItemProvider('handlebars', {
        triggerCharacters: ['{{', '.'],
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          const suggestions = triggerInScope(textUntilPosition, position.lineNumber)
            ? buildSuggestions(monaco, suggestion, model, position)
            : [];

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
    setPreview('footer/header');
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

  const channels = ['footer/header', 'main', 'Variable assignments'];
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
            updateTemplate(_template);
          }}
        />
      )}
      <GoAForm>
        <GoAFormItem>
          <Tabs
            activeIndex={activeIndex}
            changeTabCallback={(index: number) => {
              setActiveIndex(index);
              switchTabPreview(channels[index]);
              updateTemplate(tmpTemplate);
            }}
          >
            <Tab
              testId={`pdf-edit-header-footer`}
              label={<PdfEditorLabelWrapper>Header/Footer </PdfEditorLabelWrapper>}
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

            <Tab testId={`pdf-edit-body`} label={<PdfEditorLabelWrapper>Body</PdfEditorLabelWrapper>}>
              <>
                <GoAFormItem error={errors?.body ?? null}>
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
            <Tab
              testId={`pdf-test-generator`}
              label={<PdfEditorLabelWrapper>Variable Assignments</PdfEditorLabelWrapper>}
            >
              <>
                <GeneratorStyling>
                  <GeneratePDF payloadData={variables} setPayload={setVariables} />
                  <section>
                    <GeneratedPdfList templateId={template.id} />
                  </section>
                </GeneratorStyling>
              </>
            </Tab>
          </Tabs>
        </GoAFormItem>

        <EditTemplateActions>
          <PdfEditActionLayout>
            <PdfEditActions>
              <>
                <GoAButton
                  disabled={hasConfigError}
                  onClick={() => saveCurrentTemplate()}
                  type="primary"
                  data-testid="template-form-save"
                >
                  Save
                </GoAButton>
                {activeIndex === 2 && (
                  <GoAButton
                    disabled={indicator.show}
                    type="secondary"
                    data-testid="form-save"
                    onClick={() => {
                      saveCurrentTemplate();
                      const payload = {
                        templateId: template.id,
                        data: JSON.parse(variables),
                        fileName: `${template.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
                      };
                      dispatch(generatePdf(payload));
                    }}
                  >
                    <GenerateButtonPadding>
                      Generate PDF
                      {indicator.show ? (
                        <SpinnerPadding>
                          <GoAElementLoader
                            visible={true}
                            size="default"
                            baseColour="#c8eef9"
                            spinnerColour="#0070c4"
                          />
                        </SpinnerPadding>
                      ) : (
                        <SpinnerSpace></SpinnerSpace>
                      )}
                    </GenerateButtonPadding>
                  </GoAButton>
                )}
                <GoAButton
                  onClick={() => {
                    if (
                      savedTemplate.template !== template.template ||
                      savedTemplate.header !== template.header ||
                      savedTemplate.footer !== template.footer ||
                      savedTemplate.name !== template.name ||
                      savedTemplate.description !== template.description
                    ) {
                      setSaveModal(true);
                    } else {
                      cancel();
                    }
                  }}
                  data-testid="template-form-close"
                  type="tertiary"
                >
                  Back
                </GoAButton>
              </>
            </PdfEditActions>
          </PdfEditActionLayout>
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
        saveDisable={hasConfigError}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainerPdf>
  );
};
