import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePdfTemplate, getPdfTemplates } from '@store/pdf/action';
import { RootState } from '@store/index';

import { defaultPdfTemplate } from '@store/pdf/model';
import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
} from '../styled-components';

import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { generatePdf } from '@store/pdf/action';
import { useHistory, useParams } from 'react-router-dom';

export const PdfTemplatesEditor = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const pdfTemplate = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates[id];
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (!pdfTemplate) dispatch(getPdfTemplates());
  }, []);

  const history = useHistory();
  const [currentTemplate, setCurrentTemplate] = useState(pdfTemplate);
  const [currentSavedTemplate, setCurrentSavedTemplate] = useState(defaultPdfTemplate);

  const generateTemplateFunction = () => {
    const payload = {
      templateId: currentTemplate.id,
      data: currentTemplate.variables ? JSON.parse(currentTemplate.variables) : {},
      fileName: `${currentTemplate.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
    };
    const saveObject = JSON.parse(JSON.stringify(currentTemplate));
    dispatch(generatePdf(payload, saveObject));
  };

  const webappUrl = useSelector((state: RootState) => {
    return state.config.serviceUrls.tenantManagementWebApp;
  });

  useEffect(() => {
    setCurrentTemplate(pdfTemplate);
    setCurrentSavedTemplate(JSON.parse(JSON.stringify(pdfTemplate || '')));
  }, [pdfTemplate]);

  const reset = () => {
    setCurrentTemplate(defaultPdfTemplate);
    history.push({
      pathname: '/admin/services/pdf',
      state: { activeIndex: 1 },
    });
  };

  const savePdfTemplate = () => {
    const saveObject = JSON.parse(JSON.stringify(currentTemplate));
    dispatch(updatePdfTemplate(saveObject));
    setCurrentSavedTemplate(currentTemplate);
  };

  return (
    <>
      {/* Edit/Add event template for a notification */}
      <Modal data-testid="template-form">
        {/* Hides body overflow when the modal is up */}
        <BodyGlobalStyles hideOverflow={true} />
        <ModalContent>
          <NotificationTemplateEditorContainer>
            <TemplateEditor
              modelOpen={true}
              template={currentTemplate}
              savedTemplate={currentSavedTemplate}
              onBodyChange={(value) => {
                setCurrentTemplate({ ...currentTemplate, template: value });
              }}
              onHeaderChange={(value) => {
                setCurrentTemplate({ ...currentTemplate, header: value });
              }}
              onFooterChange={(value) => {
                setCurrentTemplate({ ...currentTemplate, footer: value });
              }}
              onCssChange={(value) => {
                setCurrentTemplate({ ...currentTemplate, additionalStyles: value });
              }}
              updateTemplate={(template) => {
                setCurrentTemplate(template);
              }}
              saveCurrentTemplate={savePdfTemplate}
              cancel={reset}
            />

            <PreviewTemplateContainer>
              <PreviewTemplate channelTitle="PDF preview" generateTemplate={generateTemplateFunction} />
            </PreviewTemplateContainer>
          </NotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
