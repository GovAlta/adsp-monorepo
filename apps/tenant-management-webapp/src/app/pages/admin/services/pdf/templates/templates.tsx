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
interface PdfTemplatesProps {
  openAddTemplate: boolean;
}
export const PdfTemplates: FunctionComponent<PdfTemplatesProps> = ({ openAddTemplate }) => {
  const [openAddPdfTemplate, setOpenAddPdfTemplate] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [bodyPreview, setBodyPreview] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const pdfTemplates = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates;
  });

  const [currentTemplate, setCurrentTemplate] = useState(defaultPdfTemplate);
  const [body, setBody] = useState('');

  const [isEdit, setIsEdit] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

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
    if (pdfTemplates) {
      const x = Object.keys(pdfTemplates)[0];
      setCurrentTemplate(pdfTemplates[x]);
    }
  }, [pdfTemplates]);

  const dispatch = useDispatch();

  const reset = () => {
    setIsEdit(false);
    setShowTemplateForm(false);
    setOpenAddPdfTemplate(false);
    setCurrentTemplate(defaultPdfTemplate);
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
    dispatch(updatePdfTemplate(saveObject));

    reset();
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
              setShowTemplateForm(true);
              setCurrentTemplate(currentTemplate);
              setBody(currentTemplate.template);
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
            title="Delete PDF Template"
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
                subjectEditorConfig={subjectEditorConfig}
                bodyTitle="Body"
                onBodyChange={(value) => {
                  setBody(value);

                  try {
                    setBodyPreview(
                      generateMessage(
                        getTemplateBody(value, 'pdf', {
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
                }}
                setPreview={() => {
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
                }}
                bodyEditorHintText={
                  "*GOA default styles are applied if the template doesn't include proper <html> opening and closing tags"
                }
                suggestion={getSuggestion()}
                bodyEditorConfig={bodyEditorConfig}
                saveCurrentTemplate={() => savePdfTemplate()}
                cancel={() => reset()}
              />

              <PreviewTemplateContainer>
                <PreviewTemplate channelTitle={`PDF preview`} bodyPreviewContent={bodyPreview} />
              </PreviewTemplateContainer>
            </NotificationTemplateEditorContainer>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
};
