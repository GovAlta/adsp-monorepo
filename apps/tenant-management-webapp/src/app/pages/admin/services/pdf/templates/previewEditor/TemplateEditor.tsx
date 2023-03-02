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
import { useDispatch } from 'react-redux';
import { updatePdfResponse } from '@store/pdf/action';
import GeneratedPdfList from '../generatedPdfList';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { streamPdfSocket } from '@store/pdf/action';
import { LogoutModal } from '@components/LogoutModal';
import { showCurrentFilePdf, setPdfDisplayFileId } from '@store/pdf/action';

interface TemplateEditorProps {
  modelOpen: boolean;
  onBodyChange: (value: string) => void;
  onHeaderChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onFooterChange: (value: string) => void;

  template: PdfTemplate;
  savedTemplate: PdfTemplate;
  saveCurrentTemplate?: () => void;
  // eslint-disable-next-line
  errors?: any;
  // eslint-disable-next-line
  cancel: () => void;
  updateTemplate: (template: PdfTemplate) => void;
}

const isPDFUpdated = (prev: PdfTemplate, next: PdfTemplate): boolean => {
  return (
    prev?.template !== next?.template ||
    prev?.header !== next?.header ||
    prev?.footer !== next?.footer ||
    prev?.additionalStyles !== next?.additionalStyles ||
    prev?.name !== next?.name ||
    prev?.description !== next?.description
  );
};

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  modelOpen,
  onBodyChange,
  onHeaderChange,
  onFooterChange,
  onCssChange,
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
  const [tmpTemplate, setTmpTemplate] = useState(template);
  const suggestion = template ? getSuggestion() : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useDispatch();

  const socketChannel = useSelector((state: RootState) => {
    return state?.pdf.socketChannel;
  });

  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const jobList = useSelector((state: RootState) => state.pdf.jobs.filter((job) => job.templateId === template.id));

  useEffect(() => {
    console.log('socketChannel');
    if (!socketChannel) dispatch(streamPdfSocket(false));

    setTimeout(function () {
      if (socketChannel && socketChannel.connected === false) {
        dispatch(streamPdfSocket(false));
      }
    }, 2000);
  }, [socketChannel]);

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));
    if (currentFile) {
      dispatch(showCurrentFilePdf(currentFile?.id));
    } else {
      dispatch(setPdfDisplayFileId(null));
    }
  }, [fileList]);

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

  const onVariableChange = (value) => {
    setTmpTemplate({ ...tmpTemplate, variables: value });
  };

  useEffect(() => {
    if (modelOpen) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [modelOpen]);

  const resetSavedAction = () => {
    onBodyChange(savedTemplate.template);
    onHeaderChange(savedTemplate.header);
    onFooterChange(savedTemplate.footer);
    onCssChange(savedTemplate.additionalStyles);
    onVariableChange(savedTemplate?.variables);
  };

  return (
    <TemplateEditorContainerPdf>
      <LogoutModal />
      {template && <PDFConfigForm template={template} />}
      <GoAForm>
        <GoAFormItem>
          <Tabs activeIndex={activeIndex}>
            <Tab testId={`pdf-edit-header`} label={<PdfEditorLabelWrapper>Header</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.header ?? ''}>
                <MonacoDivHeader>
                  {template && (
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.header}
                      onChange={(value) => {
                        template.header = value;
                        setTmpTemplate({ ...tmpTemplate, header: value });
                      }}
                      {...bodyEditorConfig}
                    />
                  )}
                </MonacoDivHeader>
              </GoAFormItem>
            </Tab>
            <Tab testId={`pdf-edit-body`} label={<PdfEditorLabelWrapper>Body</PdfEditorLabelWrapper>}>
              <>
                <GoAFormItem error={errors?.body ?? null}>
                  <MonacoDivBody>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.template}
                      onChange={(value) => {
                        template.template = value;
                        setTmpTemplate({ ...tmpTemplate, template: value });
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivBody>
                </GoAFormItem>
              </>
            </Tab>
            <Tab testId={`pdf-edit-footer`} label={<PdfEditorLabelWrapper>Footer</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.footer ?? ''}>
                <MonacoDivFooter>
                  <MonacoEditor
                    language={'handlebars'}
                    defaultValue={template?.footer}
                    onChange={(value) => {
                      template.footer = value;
                      setTmpTemplate({ ...tmpTemplate, footer: value });
                    }}
                    {...bodyEditorConfig}
                  />
                </MonacoDivFooter>
              </GoAFormItem>
            </Tab>
            <Tab testId={`pdf-edit-css`} label={<PdfEditorLabelWrapper>CSS</PdfEditorLabelWrapper>}>
              <>
                <GoAFormItem error={errors?.body ?? null}>
                  <MonacoDivBody>
                    <MonacoEditor
                      language={'handlebars'}
                      defaultValue={template?.additionalStyles}
                      onChange={(value) => {
                        template.additionalStyles = value;
                        setTmpTemplate({ ...tmpTemplate, additionalStyles: value });
                      }}
                      {...bodyEditorConfig}
                    />
                  </MonacoDivBody>
                </GoAFormItem>
              </>
            </Tab>
            <Tab
              testId={`pdf-test-generator`}
              label={<PdfEditorLabelWrapper>Variable assignments</PdfEditorLabelWrapper>}
            >
              <GoAFormItem error={errors?.body ?? null}>
                <MonacoDivBody>
                  <MonacoEditor
                    data-testid="form-schema"
                    value={template.variables}
                    onChange={(value) => {
                      onVariableChange(value);
                      if (tmpTemplate) {
                        tmpTemplate.variables = value;
                      }
                    }}
                    language="json"
                    {...bodyEditorConfig}
                  />
                </MonacoDivBody>
              </GoAFormItem>
            </Tab>
            <Tab testId={`pdf-test-history`} label={<PdfEditorLabelWrapper>File history</PdfEditorLabelWrapper>}>
              <>
                <GeneratorStyling>
                  <section>{template?.id && <GeneratedPdfList templateId={template.id} />}</section>
                </GeneratorStyling>
              </>
            </Tab>
          </Tabs>
        </GoAFormItem>
        <hr className="hr-resize" />
        <EditTemplateActions>
          <PdfEditActionLayout>
            <PdfEditActions>
              <>
                <GoAButton
                  disabled={hasConfigError || !isPDFUpdated(tmpTemplate, savedTemplate)}
                  onClick={() => saveCurrentTemplate()}
                  type="primary"
                  data-testid="template-form-save"
                >
                  Save
                </GoAButton>
                <GoAButton
                  onClick={() => {
                    if (isPDFUpdated(tmpTemplate, savedTemplate)) {
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
          cancel();
        }}
        saveDisable={hasConfigError}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainerPdf>
  );
};
