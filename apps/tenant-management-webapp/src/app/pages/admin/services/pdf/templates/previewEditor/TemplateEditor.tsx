import React, { useEffect, useState } from 'react';
import {
  TemplateEditorContainerPdf,
  EditTemplateActions,
  MonacoDivBody,
  PdfEditorLabelWrapper,
  PdfEditActionLayout,
  PdfEditActions,
  GeneratorStyling,
  PDFTitle,
  ButtonRight,
} from '../../styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { PdfTemplate } from '@store/pdf/model';
import { languages } from 'monaco-editor';
import { buildSuggestions, triggerInScope, convertToEditorSuggestion } from '@lib/autoComplete';
import { GoAButton } from '@abgov/react-components-new';
import { Tab, Tabs } from '@components/Tabs';
import { SaveFormModal } from '@components/saveModal';
import { PDFConfigForm } from './PDFConfigForm';
import { bodyEditorConfig } from './config';
import GeneratedPdfList from '../generatedPdfList';
import { DeleteModal } from '../DeleteModal';
import { LogoutModal } from '@components/LogoutModal';
import {
  deletePdfFilesService,
  getPdfTemplates,
  updatePdfTemplate,
  setPdfDisplayFileId,
  updateTempTemplate,
} from '@store/pdf/action';
import { FetchFilesService } from '@store/file/actions';
import { RootState } from '@store/index';
import { FetchFileService } from '@store/file/actions';
import { useHistory, useParams } from 'react-router-dom';
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
  const [saveModal, setSaveModal] = useState(false);

  const pdfTemplate = useSelector((state) => selectPdfTemplateById(state, id));

  const [tmpTemplate, setTmpTemplate] = useState(JSON.parse(JSON.stringify(pdfTemplate || '')));

  const suggestion =
    pdfTemplate && pdfTemplate.variables && convertToEditorSuggestion(JSON.parse(pdfTemplate.variables));

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
    dispatch(FetchFilesService());
  }, []);

  //eslint-disable-next-line
  useEffect(() => {
    setTmpTemplate(JSON.parse(JSON.stringify(pdfTemplate || '')));
  }, [pdfTemplate]);

  const reloadFile = useSelector((state: RootState) => state.pdf?.reloadFile);

  const savePdfTemplate = (value) => {
    const saveObject = JSON.parse(JSON.stringify(value));
    dispatch(updatePdfTemplate(saveObject));
  };

  const history = useHistory();

  const cancel = () => {
    history.push({
      pathname: '/admin/services/pdf',
      search: '?templates=true',
    });
    dispatch(setPdfDisplayFileId(null));
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
  }, [debouncedTmpTemplate, EditorError.testData]);

  useEffect(() => {
    if (reloadFile && reloadFile[pdfTemplate.id]) {
      dispatch(FetchFileService(reloadFile[pdfTemplate.id]));
    }
  }, [reloadFile]);

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

  return (
    <TemplateEditorContainerPdf>
      <LogoutModal />
      <PDFTitle>PDF / Template Editor</PDFTitle>
      <hr className="hr-resize" />
      {pdfTemplate && <PDFConfigForm template={pdfTemplate} />}

      <GoAForm>
        <GoAFormItem>
          <Tabs style={{ minWidth: '4.5em' }} activeIndex={0}>
            <Tab testId={`pdf-edit-header`} label={<PdfEditorLabelWrapper>Header</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.header ?? ''}>
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
              <>
                <GoAFormItem error={errors?.body ?? null}>
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
              </>
            </Tab>
            <Tab testId={`pdf-edit-footer`} label={<PdfEditorLabelWrapper>Footer</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.footer ?? ''}>
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
              <>
                <GoAFormItem error={errors?.body ?? null}>
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
              </>
            </Tab>
            <Tab testId={`pdf-test-generator`} label={<PdfEditorLabelWrapper>Test data</PdfEditorLabelWrapper>}>
              <GoAFormItem error={errors?.body ?? EditorError?.testData ?? null}>
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
              <>
                <GeneratorStyling style={{ height: `calc(${monacoHeight} - 1.5em` }}>
                  <ButtonRight>
                    <GoAButton
                      type="secondary"
                      testId="pdf-delete-all-files"
                      size="compact"
                      onClick={() => {
                        setShowDeleteConfirmation(true);
                      }}
                    >
                      Delete all files
                    </GoAButton>
                  </ButtonRight>
                  <section>{pdfTemplate?.id && <GeneratedPdfList templateId={pdfTemplate.id} />}</section>
                </GeneratorStyling>
              </>
            </Tab>
          </Tabs>
          <hr className="hr-resize-bottom" />
          <EditTemplateActions>
            <PdfEditActionLayout>
              <PdfEditActions>
                <>
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
                        setSaveModal(true);
                      } else {
                        cancel();
                      }
                    }}
                    testId="template-form-close"
                    type="tertiary"
                  >
                    Back
                  </GoAButton>
                </>
              </PdfEditActions>
            </PdfEditActionLayout>
          </EditTemplateActions>
        </GoAFormItem>
      </GoAForm>
      {/* Delete confirmation */}
      {showDeleteConfirmation && (
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
      )}
      <SaveFormModal
        open={saveModal}
        onDontSave={() => {
          setSaveModal(false);
          cancel();
        }}
        onSave={() => {
          savePdfTemplate(tmpTemplate);
          setSaveModal(false);
          cancel();
        }}
        saveDisable={!isPDFUpdated(tmpTemplate, pdfTemplate) || EditorError?.testData !== null}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainerPdf>
  );
};
