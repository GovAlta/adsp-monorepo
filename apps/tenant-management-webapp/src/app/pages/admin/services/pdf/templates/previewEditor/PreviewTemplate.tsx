import React, { FunctionComponent } from 'react';
import { GoAButton, GoAIconButton } from '@abgov/react-components-new';
import { generatePdf } from '@store/pdf/action';
import { GoAElementLoader } from '@abgov/react-components';
import {
  GenerateButtonPadding,
  SpinnerPadding,
  SpinnerSpace,
  PreviewTopStyle,
  PreviewContainer,
  BodyPreview,
  PDFTitle,
} from '../../styled-components';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { PdfTemplate } from '@store/pdf/model';
import { DownloadFileService } from '@store/file/actions';
interface PreviewTemplateProps {
  channelTitle: string;
  bodyPreviewContent: string;
  headerPreviewContent: string;
  footerPreviewContent: string;
  saveCurrentTemplate?: () => void;
  template: PdfTemplate;
  channel: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({
  channelTitle,
  bodyPreviewContent,
  headerPreviewContent,
  footerPreviewContent,
  channel,
  saveCurrentTemplate,
  template,
}) => {
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const pdfList = useSelector((state: RootState) => state.pdf.jobs);
  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const dispatch = useDispatch();
  const PdfPreview = () => {
    return (
      <>
        <PreviewTop title={channelTitle} />
        <BodyPreview title={channelTitle} html={bodyPreviewContent}></BodyPreview>
      </>
    );
  };

  const HeaderPreview = () => {
    return (
      <>
        <PreviewTop title="Header" />
        <BodyPreview data-testid="header-preview-subject" title="Header" html={headerPreviewContent}></BodyPreview>
      </>
    );
  };

  const FooterPreview = () => {
    return (
      <>
        <PreviewTop title="Footer" />
        <BodyPreview data-testid="footer-preview-subject" title="Footer" html={footerPreviewContent}></BodyPreview>
      </>
    );
  };
  const PreviewTop = ({ title }) => {
    return (
      <>
        <PreviewTopStyle>
          <PDFTitle>{title}</PDFTitle>

          <GoAButton
            disabled={indicator.show}
            type="secondary"
            data-testid="form-save"
            size="compact"
            onClick={() => {
              saveCurrentTemplate();
              const payload = {
                templateId: template.id,
                data: template.variables ? JSON.parse(template.variables) : {},
                fileName: `${template.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
              };
              dispatch(generatePdf(payload));
            }}
          >
            <GenerateButtonPadding>
              Generate PDF
              {indicator.show ? (
                <SpinnerPadding>
                  <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
                </SpinnerPadding>
              ) : (
                <SpinnerSpace></SpinnerSpace>
              )}
            </GenerateButtonPadding>
          </GoAButton>
          {
            <GoAIconButton
              icon="download"
              title="Download"
              testId="download-icon"
              size="medium"
              onClick={() => {
                const file = fileList[0];
                if (file.recordId === pdfList[0].id && file.filename.indexOf(pdfList[0].templateId) > -1) {
                  onDownloadFile(file);
                }
              }}
            />
          }
        </PreviewTopStyle>
        <hr className="hr-resize" style={{ marginTop: '0.5rem' }} />
      </>
    );
  };

  const previewByType = {
    main: <PdfPreview />,
    header: <HeaderPreview />,
    footer: <FooterPreview />,
    additionalStyles: <PdfPreview />,
    variableAssignments: <PdfPreview />,
    history: <PdfPreview />,
  };

  return <PreviewContainer>{previewByType[channel]}</PreviewContainer>;
};
