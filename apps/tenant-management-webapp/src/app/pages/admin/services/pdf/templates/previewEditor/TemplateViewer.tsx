import React, { useEffect, useState } from 'react';
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
import { GoAButton, GoAFormItem, GoAButtonGroup, GoACircularProgress } from '@abgov/react-components-new';
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
  getCorePdfTemplates,
  updatePdfTemplate,
  setPdfDisplayFileId,
  updateTempTemplate,
} from '@store/pdf/action';

import { RootState } from '@store/index';
import { FetchFileService } from '@store/file/actions';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebounce } from '@lib/useDebounce';
import { selectPdfTemplateById, selectCorePdfTemplateById } from '@store/pdf/selectors';
import { CustomLoader } from '@components/CustomLoader';

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

export const TemplateViewer = ({ errors }: TemplateEditorProps): JSX.Element => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const monaco = useMonaco();
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);

  const pdfTemplate = useSelector((state) => selectCorePdfTemplateById(state, id) || selectPdfTemplateById(state, id));

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
      dispatch(getCorePdfTemplates());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //eslint-disable-next-line
  useEffect(() => {
    setTmpTemplate(JSON.parse(JSON.stringify(pdfTemplate || '')));
  }, [pdfTemplate]);

  useEffect(() => {
    if (saveModal.closeEditor) {
      cancel();
    }
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadFile = useSelector((state: RootState) => state.pdf?.reloadFile);

  const savePdfTemplate = (value, options = null) => {
    const saveObject = JSON.parse(JSON.stringify(value));
    dispatch(updatePdfTemplate(saveObject, options));
  };

  const navigate = useNavigate();

  const cancel = () => {
    dispatch(setPdfDisplayFileId(null));
    navigate('/admin/services/pdf?templates=true');
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

    setCustomIndicator(false);
  }, [debouncedTmpTemplate, EditorError.testData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reloadFile && reloadFile[pdfTemplate.id]) {
      dispatch(FetchFileService(reloadFile[pdfTemplate.id]));
    }
  }, [reloadFile]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {customIndicator && <CustomLoader />}
      <PDFTitle>PDF / Template Editor</PDFTitle>
      <hr />

      {pdfTemplate && <PDFConfigForm template={pdfTemplate} isEdit={false} />}
      <GoAFormItem label="">
        <Tabs activeIndex={0}>
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
