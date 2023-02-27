import React, { FunctionComponent } from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { generatePdf } from '@store/pdf/action';
import { GoAElementLoader } from '@abgov/react-components';
import {
  GenerateButtonPadding,
  SpinnerPadding,
  SpinnerSpace,
  PreviewTopStyle,
  PreviewContainer,
  BodyPreview,
} from '../../styled-components';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { PdfTemplate } from '@store/pdf/model';
interface PreviewTemplateProps {
  channelTitle: string;
  bodyPreviewContent: string;
  headerPreviewContent: string;
  footerPreviewContent: string;
  saveCurrentTemplate?: () => void;
  template: PdfTemplate;
  channel: string;
}

const base64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

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
  const files = useSelector((state: RootState) => {
    return state?.pdf.files;
  });
  const currentId = useSelector((state: RootState) => {
    return state?.pdf.currentId;
  });
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

  const PreviewPreview = () => {
    console.log(JSON.stringify(blobUrl) + '<blobUrl');
    console.log(JSON.stringify(blob) + '<blob');
    return (
      <>
        <PreviewTop title={channelTitle} />
        {blobUrl && (
          <div>
            <div>
              <object type="application/pdf" data={blobUrl} height="650" style={{ width: '100%' }}>
                <iframe src={blobUrl} height="100%" width="100%"></iframe>
              </object>
            </div>
          </div>
        )}
      </>
    );
  };

  console.log(JSON.stringify(files) + '<files');
  console.log(JSON.stringify(currentId) + '<currentId');
  console.log(JSON.stringify(files[currentId]) + '<files[currentId]');

  const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');
  const xx = files[currentId] && 42;
  console.log(xx + '<xx');
  console.log(JSON.stringify(blob) + '<blobblob');
  const blobUrl = blob && URL.createObjectURL(blob);

  const PreviewTop = ({ title }) => {
    return (
      <PreviewTopStyle>
        <h3>{title}</h3>
        <GoAButton
          disabled={indicator.show}
          type="secondary"
          data-testid="form-save"
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
      </PreviewTopStyle>
    );
  };

  const previewByType = {
    main: <PreviewPreview />,
    header: <PreviewPreview />,
    footer: <PreviewPreview />,
    additionalStyles: <PreviewPreview />,
    variableAssignments: <PreviewPreview />,
  };

  return <PreviewContainer>{previewByType[channel]}</PreviewContainer>;
};
