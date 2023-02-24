import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePdfTemplate } from '@store/pdf/action';
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
import { generateMessage } from '@lib/handlebarHelper';
import { getTemplateBody } from '@core-services/notification-shared';
import { useDebounce } from '@lib/useDebounce';
import { useHistory, useParams } from 'react-router-dom';

export const PdfTemplatesEditor = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const pdfTemplate = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates[id];
  });

  const [bodyPreview, setBodyPreview] = useState('');
  const [headerPreview, setHeaderPreview] = useState('');
  const [footerPreview, setFooterPreview] = useState('');
  const [currentChannel, setCurrentChannel] = useState('header');
  const TEMPLATE_RENDER_DEBOUNCE_TIMER = 500; // ms
  const history = useHistory();
  const [currentTemplate, setCurrentTemplate] = useState(pdfTemplate);
  const [currentSavedTemplate, setCurrentSavedTemplate] = useState(defaultPdfTemplate);
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [header, setHeader] = useState('');
  const [variables, setVariables] = useState('');
  const [additionalStyles, setAdditionalStyles] = useState('');

  const debouncedRenderBodyPreview = useDebounce(body, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderFooterPreview = useDebounce(footer, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderHeaderPreview = useDebounce(header, TEMPLATE_RENDER_DEBOUNCE_TIMER);
  const debouncedRenderCSSPreview = useDebounce(additionalStyles, TEMPLATE_RENDER_DEBOUNCE_TIMER);

  const channelNames = {
    main: 'PDF preview',
    header: 'Header preview',
    footer: 'Footer preview',
    additionalStyles: 'PDF preview',
    variableAssignments: 'PDF preview',
    history: 'PDF preview',
  };
  // eslint-disable-next-line
  useEffect(() => {}, [pdfTemplate]);

  const webappUrl = useSelector((state: RootState) => {
    return state.config.serviceUrls.tenantManagementWebApp;
  });
  useEffect(() => {
    setCurrentTemplate(pdfTemplate);
    setCurrentSavedTemplate(JSON.parse(JSON.stringify(pdfTemplate)));
    setBody(pdfTemplate?.template || '');
    setFooter(pdfTemplate?.footer || '');
    setHeader(pdfTemplate?.header || '');
  }, [pdfTemplate]);

  useEffect(() => {
    try {
      let template = '';
      // If footer is empty, we shall add PDF wrapper for the footer in the preview.
      if (footer && footer.length > 0) {
        template = getTemplateBody(('<style>' + additionalStyles + '</style>').concat(footer), 'pdf-footer', {
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
        template = getTemplateBody(('<style>' + additionalStyles + '</style>').concat(header), 'pdf-header', {
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
        template = getTemplateBody(('<style>' + additionalStyles + '</style>').concat(body), 'pdf', {
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
  }, [debouncedRenderBodyPreview, debouncedRenderCSSPreview]);

  const dispatch = useDispatch();

  const reset = () => {
    setCurrentTemplate(defaultPdfTemplate);
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
    saveObject.additionalStyles = additionalStyles;
    saveObject.variables = variables;
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
                setBody(value);
              }}
              onHeaderChange={(value) => {
                setHeader(value);
              }}
              onFooterChange={(value) => {
                setFooter(value);
              }}
              onCssChange={(value) => {
                setAdditionalStyles(value);
              }}
              onVariableChange={(value) => {
                setVariables(value);
              }}
              updateTemplate={(template) => {
                setCurrentTemplate(template);
              }}
              setPreview={(channel) => {
                try {
                  setBodyPreview(
                    generateMessage(
                      getTemplateBody(('<style>' + additionalStyles + '</style>').concat(body), 'pdf', {
                        data: currentTemplate,
                        serviceUrl: webappUrl,
                        today: new Date().toDateString(),
                      }),
                      { data: currentTemplate, serviceUrl: webappUrl, today: new Date().toDateString() }
                    )
                  );

                  setHeaderPreview(
                    generateMessage(
                      getTemplateBody(('<style>' + additionalStyles + '</style>').concat(header), 'pdf', {
                        data: currentTemplate,
                        serviceUrl: webappUrl,
                        today: new Date().toDateString(),
                      }),
                      {
                        data: currentTemplate,
                        serviceUrl: webappUrl,
                        today: new Date().toDateString(),
                      }
                    )
                  );

                  setFooterPreview(
                    generateMessage(
                      getTemplateBody(('<style>' + additionalStyles + '</style>').concat(footer), 'pdf', {
                        data: currentTemplate,
                        serviceUrl: webappUrl,
                        today: new Date().toDateString(),
                      }),
                      {
                        data: currentTemplate,
                        serviceUrl: webappUrl,
                        today: new Date().toDateString(),
                      }
                    )
                  );
                } catch (e) {
                  console.error('error: ' + e.message);
                }

                setCurrentChannel(channel);
              }}
              saveCurrentTemplate={savePdfTemplate}
              cancel={reset}
            />

            <PreviewTemplateContainer>
              <PreviewTemplate
                channelTitle={channelNames[currentChannel]}
                bodyPreviewContent={bodyPreview}
                headerPreviewContent={headerPreview}
                footerPreviewContent={footerPreview}
                channel={currentChannel}
                saveCurrentTemplate={savePdfTemplate}
                template={currentTemplate}
              />
            </PreviewTemplateContainer>
          </NotificationTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
