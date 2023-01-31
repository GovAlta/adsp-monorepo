import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePdfTemplate } from '@store/pdf/action';
import { RootState } from '@store/index';

import { defaultPdfTemplate } from '@store/pdf/model';
import { PdfTemplate } from '@store/pdf/model';
import {
  PreviewTemplateContainer,
  NotificationTemplateEditorContainer,
  Modal,
  BodyGlobalStyles,
  ModalContent,
} from './previewEditor/styled-components';

import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@core-services/notification-shared';
import { useDebounce } from '@lib/useDebounce';
import { hasXSS, XSSErrorMessage } from '@lib/sanitize';
import { useHistory } from 'react-router-dom';

export interface PdfTemplatesEditorProps {
  passedTemplate?: PdfTemplate;
}
export const PdfTemplatesEditor: FunctionComponent<PdfTemplatesEditorProps> = ({ passedTemplate }) => {
  const [bodyPreview, setBodyPreview] = useState('');
  const [headerPreview, setHeaderPreview] = useState('');
  const [footerPreview, setFooterPreview] = useState('');
  const [currentChannel, setCurrentChannel] = useState('footer/header');
  const XSS_CHECK_RENDER_DEBOUNCE_TIMER = 2000; // ms
  const TEMPLATE_RENDER_DEBOUNCE_TIMER = 500; // ms
  const history = useHistory();
  const [currentTemplate, setCurrentTemplate] = useState(passedTemplate);
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

  const editDefaultErrors = {
    body: '',
    footer: '',
    header: '',
  };

  const [templateEditErrors, setTemplateEditErrors] = useState(editDefaultErrors);
  const channelNames = {
    main: 'PDF preview',
    'header/footer': 'Header / Footer preview',
    'Template variables': 'PDF preview',
  };

  const webappUrl = useSelector((state: RootState) => {
    return state.config.serviceUrls.tenantManagementWebApp;
  });
  useEffect(() => {
    setCurrentTemplate(passedTemplate);
    setCurrentSavedTemplate(JSON.parse(JSON.stringify(passedTemplate)));
    setBody(passedTemplate?.template || '');
    setFooter(passedTemplate?.footer || '');
    setHeader(passedTemplate?.header || '');
  }, [passedTemplate]);
  useEffect(() => {
    try {
      let template = '';
      // If footer is empty, we shall add PDF wrapper for the footer in the preview.
      if (footer && footer.length > 0) {
        template = getTemplateBody(footer, 'pdf-footer', {
          data: currentTemplate,
          serviceUrl: webappUrl,
          today: new Date().toDateString(),
        });
      }
      setFooterPreview(
        generateMessage(template, { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() })
      );
    } catch (e) {
      console.error('error: ' + e.message);
    }
  }, [debouncedRenderFooterPreview]);

  useEffect(() => {
    try {
      let template = '';
      // If header is empty, we shall add PDF wrapper for the header in the preview.
      if (header && header.length > 0) {
        template = getTemplateBody(header, 'pdf-header', {
          data: currentTemplate,
          serviceUrl: webappUrl,
          today: new Date().toDateString(),
        });
      }
      setHeaderPreview(
        generateMessage(template, { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() })
      );
    } catch (e) {
      console.error('error: ' + e.message);
    }
  }, [debouncedRenderHeaderPreview]);

  useEffect(() => {
    try {
      let template = '';
      // If body is empty, we shall add PDF wrapper for the body in the preview.
      if (currentTemplate?.template.length > 0) {
        template = getTemplateBody(body, 'pdf', {
          data: currentTemplate,
          serviceUrl: webappUrl,
          today: new Date().toDateString(),
        });
      }

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
    setCurrentTemplate(defaultPdfTemplate);
    setTemplateEditErrors(editDefaultErrors);
    setBodyPreview('');
    setFooterPreview('');
    setHeaderPreview('');
    history.push({
      pathname: '/admin/services/pdf',
      state: { activeIndex: 1 },
    });
  };

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
              saveCurrentTemplate={savePdfTemplate}
              cancel={reset}
              errors={templateEditErrors}
              validateEventTemplateFields={validateEventTemplateFields}
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
    </>
  );
};
