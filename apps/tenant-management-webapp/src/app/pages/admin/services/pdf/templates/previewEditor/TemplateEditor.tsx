import React, { useCallback, useEffect, useState } from 'react';
import {
  TemplateEditorContainerPdf,
  EditTemplateActions,
  MonacoDivBody,
  PdfEditorLabelWrapper,
  PdfEditActionLayout,
  GeneratorStyling,
  PDFTitle,
  ButtonRight,
} from '../../styled-components';
import { useDispatch, useSelector } from 'react-redux';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions, triggerInScope, convertToEditorSuggestion } from '@lib/autoComplete';
import { GoAButton, GoAFormItem, GoAButtonGroup } from '@abgov/react-components-new';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { PDFConfigForm } from './PDFConfigForm';
import { bodyEditorConfig } from './config';
import GeneratedPdfList from '../generatedPdfList';
import { DeleteModal } from '@components/DeleteModal';
import { LogoutModal } from '@components/LogoutModal';
import {
  deletePdfFilesService,
  getPdfTemplates,
  updatePdfTemplate,
  setPdfDisplayFileId,
  updateTempTemplate,
} from '@store/pdf/action';

import { RootState } from '@store/index';
import { FetchFileService } from '@store/file/actions';
import { useNavigate, useParams } from 'react-router-dom-6';
import { useDebounce } from '@lib/useDebounce';
import { selectPdfTemplateById } from '@store/pdf/selectors';

const TEMPLATE_RENDER_DEBOUNCE_TIMER = 500; // ms

interface TemplateEditorProps {
  //eslint-disable-next-line
  errors?: any;
}

const isPDFUpdated = (prev: PdfTemplate, next: PdfTemplate): boolean => {
  return (
    prev?.template !== next?.template ||
    prev?.header !== next?.header ||
    prev?.footer !== next?.footer ||
    prev?.additionalStyles !== next?.additionalStyles ||
    prev?.variables !== next?.variables
  );
};

export const TemplateEditor = ({ errors }: TemplateEditorProps): JSX.Element => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const monaco = useMonaco();
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });

  const pdfTemplate = useSelector((state) => selectPdfTemplateById(state, id));

  const [tmpTemplate, setTmpTemplate] = useState(JSON.parse(JSON.stringify(pdfTemplate || '')));

  const suggestion =
    pdfTemplate && pdfTemplate.variables && convertToEditorSuggestion(JSON.parse(pdfTemplate.variables));

  const elementIndicator = useSelector((state: RootState) => {
    return state?.session?.elementIndicator;
  });

  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const debouncedTmpTemplate = useDebounce(tmpTemplate, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const tempPdfTemplate = useSelector((state: RootState) => state?.pdf?.tempTemplate);
  const [EditorError, setEditorError] = useState<Record<string, string>>({
    testData: null,
  });

  useEffect(() => {
    if (!pdfTemplate) {
      dispatch(getPdfTemplates());
    }
  }, [dispatch,pdfTemplate]);

  const navigate = useNavigate();

  const cancel = useCallback(() => {
    dispatch(setPdfDisplayFileId(null));
    navigate('/admin/services/pdf?templates=true');
  }, [dispatch, navigate]);
  //eslint-disable-next-line
  useEffect(() => {
    setTmpTemplate(JSON.parse(JSON.stringify(pdfTemplate || '')));
  }, [pdfTemplate]);

  useEffect(() => {
    if (saveModal.closeEditor) {
      cancel();
    }
  }, [saveModal, cancel]);

  const reloadFile = useSelector((state: RootState) => state.pdf?.reloadFile);

  const savePdfTemplate = (value, options = null) => {
    const saveObject = JSON.parse(JSON.stringify(value));
    dispatch(updatePdfTemplate(saveObject, options));
  };


  useEffect(() => {
    // If there are any errors in the temp template, we shall prevent preview and PDF generation.
    if (EditorError?.testData) {
      dispatch(updateTempTemplate(null));
      return;
    }

    // Sync tmpTemplate component status with the counterpart in the redux
    if (isPDFUpdated(tempPdfTemplate, tmpTemplate)) {
      dispatch(updateTempTemplate(tmpTemplate));
    }
  }, [dispatch, debouncedTmpTemplate, EditorError.testData, tempPdfTemplate]);

  useEffect(() => {
    if (reloadFile && reloadFile[pdfTemplate.id]) {
      dispatch(FetchFileService(reloadFile[pdfTemplate.id]));
    }
  }, [reloadFile, dispatch, pdfTemplate.id]);

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

  const monacoHeight = `calc(100vh - 585px${notifications.length > 0 ? ' - 80px' : ''})`;
  const pdfList = useSelector((state: RootState) =>
    state.pdf?.jobs?.filter((job) => job.templateId === pdfTemplate.id)
  );

  const backButtonDisabled = () => {
    if (!elementIndicator) return false;

    if (elementIndicator?.show) return true;

    return false;
  };

  return (
    <TemplateEditorContainerPdf>
      <LogoutModal />
      <PDFTitle>PDF / Template Editor</PDFTitle>
      <hr />

      {pdfTemplate && <PDFConfigForm template={pdfTemplate} />}
      <GoAFormItem label="">
        <Tabs activeIndex={0}>
          <Tab testId={`pdf-edit-header`} label={<PdfEditorLabelWrapper>Header</PdfEditorLabelWrapper>}>
            <GoAFormItem error={errors?.header ?? ''} label="">
              <MonacoDivBody style={{ height: monacoHeight }}>
                {pdfTemplate && (
                  <MonacoEditor
                    language={'handlebars'}
                    value={tmpTemplate?.header}
                    data-testid="templateForm-header"
                    onChange={(value) => {
                      setTmpTemplate({ ...tmpTemplate, header: value });
                    }}
                    {...bodyEditorConfig}
                  />
                )}
              </MonacoDivBody>
            </GoAFormItem>
          </Tab>
          <Tab testId={`pdf-edit-body`} label={<PdfEditorLabelWrapper>Body</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.body ?? null} label="">
                <MonacoDivBody style={{ height: monacoHeight }}>
                  <MonacoEditor
                    language={'handlebars'}
                    value={tmpTemplate?.template}
                    data-testid="templateForm-body"
                    onChange={(value) => {
                      setTmpTemplate({ ...tmpTemplate, template: value });
                    }}
                    {...bodyEditorConfig}
                  />
                </MonacoDivBody>
              </GoAFormItem>
          </Tab>
          <Tab testId={`pdf-edit-footer`} label={<PdfEditorLabelWrapper>Footer</PdfEditorLabelWrapper>}>
            <GoAFormItem error={errors?.footer ?? ''} label="">
              <MonacoDivBody style={{ height: monacoHeight }}>
                <MonacoEditor
                  language={'handlebars'}
                  value={tmpTemplate?.footer}
                  data-testid="templateForm-footer"
                  onChange={(value) => {
                    setTmpTemplate({ ...tmpTemplate, footer: value });
                  }}
                  {...bodyEditorConfig}
                />
              </MonacoDivBody>
            </GoAFormItem>
          </Tab>
          <Tab testId={`pdf-edit-css`} label={<PdfEditorLabelWrapper>CSS</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.body ?? null} label="">
                <MonacoDivBody style={{ height: monacoHeight }}>
                  <MonacoEditor
                    language={'handlebars'}
                    value={tmpTemplate?.additionalStyles}
                    data-testid="templateForm-css"
                    onChange={(value) => {
                      setTmpTemplate({ ...tmpTemplate, additionalStyles: value });
                    }}
                    {...bodyEditorConfig}
                  />
                </MonacoDivBody>
              </GoAFormItem>
          </Tab>
          <Tab testId={`pdf-test-generator`} label={<PdfEditorLabelWrapper>Test data</PdfEditorLabelWrapper>}>
            <GoAFormItem error={errors?.body ?? EditorError?.testData ?? null} label="">
              <MonacoDivBody style={{ height: monacoHeight }}>
                <MonacoEditor
                  data-testid="form-schema"
                  value={tmpTemplate?.variables}
                  onChange={(value) => {
                    setTmpTemplate({ ...tmpTemplate, variables: value });
                  }}
                  onValidate={(makers) => {
                    if (makers.length !== 0) {
                      setEditorError({
                        testData: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                      });
                    } else {
                      setEditorError({
                        testData: null,
                      });
                    }
                  }}
                  language="json"
                  {...bodyEditorConfig}
                />
              </MonacoDivBody>
            </GoAFormItem>
          </Tab>
          <Tab testId={`pdf-test-history`} label={<PdfEditorLabelWrapper>File history</PdfEditorLabelWrapper>}>
              <GeneratorStyling style={{ height: monacoHeight }}>
                <ButtonRight>
                  <GoAButton
                    type="secondary"
                    testId="pdf-delete-all-files"
                    size="normal"
                    onClick={() => {
                      setShowDeleteConfirmation(true);
                    }}
                    disabled={pdfList === null || pdfList?.length === 0}
                  >
                    Delete all files
                  </GoAButton>
                </ButtonRight>
                <section className="scroll-bar">
                  {pdfTemplate?.id && <GeneratedPdfList templateId={pdfTemplate.id} />}
                </section>
              </GeneratorStyling>
          </Tab>
        </Tabs>
        <hr className="hr-resize-bottom" />
        <EditTemplateActions>
          <PdfEditActionLayout>
            <GoAButtonGroup alignment="start">
              <GoAButton
                disabled={!isPDFUpdated(tmpTemplate, pdfTemplate) || EditorError?.testData !== null}
                onClick={() => {
                  savePdfTemplate(tmpTemplate);
                }}
                type="primary"
                testId="template-form-save"
              >
                Save
              </GoAButton>
              <GoAButton
                onClick={() => {
                  if (isPDFUpdated(tmpTemplate, pdfTemplate)) {
                    setSaveModal({ visible: true, closeEditor: false });
                  } else {
                    cancel();
                  }
                }}
                testId="template-form-close"
                type="secondary"
                disabled={backButtonDisabled()}
              >
                Back
              </GoAButton>
            </GoAButtonGroup>
          </PdfEditActionLayout>
        </EditTemplateActions>
      </GoAFormItem>

      {/* Delete confirmation */}
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete PDF file"
        content={<div>Are you sure you wish to delete all files?</div>}
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deletePdfFilesService(pdfTemplate.id));
        }}
      />
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          setSaveModal({ visible: false, closeEditor: true });
        }}
        onSave={() => {
          savePdfTemplate(tmpTemplate, 'no-refresh');
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={!isPDFUpdated(tmpTemplate, pdfTemplate) || EditorError?.testData !== null}
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
    </TemplateEditorContainerPdf>
  );
};
