import React, { FunctionComponent, useEffect, useState } from 'react';
import { AddEditPdfTemplate } from './AddEditPdfTemplates';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, updatePdfTemplate, deletePdfTemplate } from '@store/pdf/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { PdfTemplatesTable } from './templatesList';
import { PageIndicator } from '@components/Indicator';
import { defaultPdfTemplate } from '@store/pdf/model';
import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
} from './previewEditor/styled-components';
import { subjectEditorConfig, bodyEditorConfig } from './previewEditor/config';
import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@core-services/notification-shared';
import { DeleteModal } from '@components/DeleteModal';
import { useDebounce } from '@lib/useDebounce';
import { hasXSS, XSSErrorMessage } from '@lib/sanitize';

interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates: FunctionComponent<PdfTemplatesProps> = ({ openAddTemplate }) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [bodyPreview, setBodyPreview] = useState('');
  const [headerPreview, setHeaderPreview] = useState('');
  const [footerPreview, setFooterPreview] = useState('');
  const [currentChannel, setCurrentChannel] = useState('footer/header');
  const XSS_CHECK_RENDER_DEBOUNCE_TIMER = 2000; // ms
  const TEMPLATE_RENDER_DEBOUNCE_TIMER = 500; // ms

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const pdfTemplates = useSelector((state: RootState) => {
    return Object.entries(state?.pdf?.pdfTemplates)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [pdfTemplateId, pdfTemplateData]) => {
        tempObj[pdfTemplateId] = pdfTemplateData;
        return tempObj;
      }, {});
  });

  const [currentTemplate, setCurrentTemplate] = useState(defaultPdfTemplate);
  const [currentSavedTemplate, setCurrentSavedTemplate] = useState(defaultPdfTemplate);
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [header, setHeader] = useState('');

  const debouncedRenderBodyPreview = useDebounce(body, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderFooterPreview = useDebounce(footer, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderHeaderPreview = useDebounce(header, TEMPLATE_RENDER_DEBOUNCE_TIMER);

  const debouncedXssCheckRenderBody = useDebounce(body, XSS_CHECK_RENDER_DEBOUNCE_TIMER);
  const debouncedXssCheckRenderFooter = useDebounce(footer, XSS_CHECK_RENDER_DEBOUNCE_TIMER);
  const debouncedXssCheckRenderHeader = useDebounce(header, XSS_CHECK_RENDER_DEBOUNCE_TIMER);

  const [isEdit, setIsEdit] = useState(false);
  const editDefaultErrors = {
    body: '',
    footer: '',
    header: '',
  };

  const [templateEditErrors, setTemplateEditErrors] = useState(editDefaultErrors);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const channelNames = { main: 'PDF preview', 'header/footer': 'Header / Footer preview' };

  const webappUrl = useSelector((state: RootState) => {
    return state.config.serviceUrls.tenantManagementWebApp;
  });

  const getSuggestion = () => {
    if (currentTemplate) {
      const x = [
        {
          label: 'data',
          insertText: 'data',
          children: [
            {
              label: 'id',
              insertText: 'id',
            },
            {
              label: 'name',
              insertText: 'name',
            },
            {
              label: 'description',
              insertText: 'description',
            },
            {
              label: 'template',
              insertText: 'template',
            },
          ],
        },
      ];
      return x;
    }
    return [];
  };

  useEffect(() => {
    try {
      const template = getTemplateBody(footer, 'pdf', {
        data: currentTemplate,
        serviceUrl: webappUrl,
        today: new Date().toDateString(),
      });
      setFooterPreview(
        generateMessage(template, { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() })
      );
    } catch (e) {
      console.error('error: ' + e.message);
    }
  }, [debouncedRenderFooterPreview]);

  useEffect(() => {
    try {
      const template = getTemplateBody(header, 'pdf', {
        data: currentTemplate,
        serviceUrl: webappUrl,
        today: new Date().toDateString(),
      });
      setHeaderPreview(
        generateMessage(template, { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() })
      );
    } catch (e) {
      console.error('error: ' + e.message);
    }
  }, [debouncedRenderHeaderPreview]);

  useEffect(() => {
    try {
      const template = getTemplateBody(body, 'pdf', {
        data: currentTemplate,
        serviceUrl: webappUrl,
        today: new Date().toDateString(),
      });
      setBodyPreview(
        generateMessage(template, { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() })
      );
    } catch (e) {
      console.error('error: ' + e.message);
    }
  }, [debouncedRenderBodyPreview]);

  useEffect(() => {
    if (hasXSS(debouncedXssCheckRenderBody)) {
      setTemplateEditErrors({
        ...templateEditErrors,
        body: XSSErrorMessage,
      });
    } else {
      if (templateEditErrors.body !== '') {
        setTemplateEditErrors({
          ...templateEditErrors,
          body: '',
        });
      }
    }
  }, [debouncedXssCheckRenderBody]);

  useEffect(() => {
    if (hasXSS(debouncedXssCheckRenderFooter)) {
      setTemplateEditErrors({
        ...templateEditErrors,
        footer: XSSErrorMessage,
      });
    } else {
      if (templateEditErrors.footer !== '') {
        setTemplateEditErrors({
          ...templateEditErrors,
          footer: '',
        });
      }
    }
  }, [debouncedXssCheckRenderFooter]);

  useEffect(() => {
    if (hasXSS(debouncedXssCheckRenderHeader)) {
      setTemplateEditErrors({
        ...templateEditErrors,
        header: XSSErrorMessage,
      });
    } else {
      if (templateEditErrors.header !== '') {
        setTemplateEditErrors({
          ...templateEditErrors,
          header: '',
        });
      }
    }
  }, [debouncedXssCheckRenderHeader]);

  const dispatch = useDispatch();

  const reset = () => {
    setIsEdit(false);
    setShowTemplateForm(false);
    setOpenAddPdfTemplate(false);
    setCurrentTemplate(defaultPdfTemplate);
    setTemplateEditErrors(editDefaultErrors);
  };

  useEffect(() => {
    if (openAddTemplate) {
      setOpenAddPdfTemplate(true);
    }
  }, [openAddTemplate]);
  useEffect(() => {
    dispatch(getPdfTemplates());
  }, []);

  const savePdfTemplate = () => {
    const saveObject = JSON.parse(JSON.stringify(currentTemplate));
    saveObject.template = body;
    saveObject.header = header;
    saveObject.footer = footer;
    dispatch(updatePdfTemplate(saveObject));

    reset();
  };

  const validateEventTemplateFields = () => {
    try {
      const xssTemplate =
        templateEditErrors?.header !== '' || templateEditErrors?.footer !== '' || templateEditErrors?.body !== '';
      return true && !xssTemplate;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <>
      <div>
        <br />
        <GoAButton
          data-testid="add-template"
          onClick={() => {
            setOpenAddPdfTemplate(true);
          }}
        >
          Add template
        </GoAButton>
        <br />
        <br />
        <PageIndicator />
        {(isEdit || openAddPdfTemplate) && (
          <AddEditPdfTemplate
            open={openAddPdfTemplate}
            isEdit={isEdit}
            onClose={reset}
            initialValue={defaultPdfTemplate}
            onSave={(definition) => {
              dispatch(updatePdfTemplate(definition));
            }}
          />
        )}
        {!indicator.show && !pdfTemplates && renderNoItem('pdf templates')}
        {!indicator.show && pdfTemplates && (
          <PdfTemplatesTable
            templates={pdfTemplates}
            edit={(currentTemplate) => {
              setCurrentTemplate(currentTemplate);
              setCurrentSavedTemplate(Object.assign({}, currentTemplate));
              setShowTemplateForm(true);
            }}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentTemplate(currentTemplate);
            }}
          />
        )}
        {/* Delete confirmation */}
        {showDeleteConfirmation && (
          <DeleteModal
            isOpen={showDeleteConfirmation}
            title="Delete PDF template"
            content={`Delete ${currentTemplate?.id}?`}
            onCancel={() => setShowDeleteConfirmation(false)}
            onDelete={() => {
              setShowDeleteConfirmation(false);
              dispatch(deletePdfTemplate(currentTemplate));
            }}
          />
        )}
        {/* Edit/Add event template for a notification */}
        <Modal open={showTemplateForm} data-testid="template-form">
          {/* Hides body overflow when the modal is up */}
          <BodyGlobalStyles hideOverflow={showTemplateForm} />
          <ModalContent>
            <NotificationTemplateEditorContainer>
              <TemplateEditor
                modelOpen={showTemplateForm}
                mainTitle="PDF Generation"
                subjectTitle="Subject"
                template={currentTemplate}
                savedTemplate={currentSavedTemplate}
                subjectEditorConfig={subjectEditorConfig}
                bodyTitle="Body"
                onBodyChange={(value) => {
                  setBody(value);
                }}
                onHeaderChange={(value) => {
                  setHeader(value);
                }}
                onFooterChange={(value) => {
                  setFooter(value);
                }}
                updateTemplate={(template) => {
                  setCurrentTemplate(template);
                }}
                setPreview={(channel) => {
                  try {
                    setBodyPreview(
                      generateMessage(
                        getTemplateBody(body, 'pdf', {
                          data: currentTemplate,
                          serviceUrl: webappUrl,
                          today: new Date().toDateString(),
                        }),
                        { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() }
                      )
                    );
                  } catch (e) {
                    console.error('error: ' + e.message);
                  }

                  setCurrentChannel(channel);
                }}
                suggestion={getSuggestion()}
                bodyEditorConfig={bodyEditorConfig}
                saveCurrentTemplate={() => savePdfTemplate()}
                cancel={() => reset()}
                errors={templateEditErrors}
                validateEventTemplateFields={() => {
                  return validateEventTemplateFields();
                }}
              />

              <PreviewTemplateContainer>
                <PreviewTemplate
                  channelTitle={channelNames[currentChannel]}
                  bodyPreviewContent={bodyPreview}
                  headerPreviewContent={headerPreview}
                  footerPreviewContent={footerPreview}
                  channel={currentChannel}
                />
              </PreviewTemplateContainer>
            </NotificationTemplateEditorContainer>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
};
