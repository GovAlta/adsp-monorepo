import React, { FunctionComponent } from 'react';
import { PreviewContainer, BodyPreview } from './styled-components';

interface PreviewTemplateProps {
  channelTitle: string;
  bodyPreviewContent: string;
  headerPreviewContent: string;
  footerPreviewContent: string;
  channel: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({
  channelTitle,
  bodyPreviewContent,
  headerPreviewContent,
  footerPreviewContent,
  channel,
}) => {
  const PdfPreview = ({ title, html }) => {
    return (
      <>
        <h3>{title}</h3>
        <BodyPreview title={title} html={html}></BodyPreview>
      </>
    );
  };

  const previewByType = {
    main: <PdfPreview title={channelTitle} html={bodyPreviewContent} />,
    header: <PdfPreview title={'Header'} html={headerPreviewContent} />,
    footer: <PdfPreview title={'Footer'} html={footerPreviewContent} />,
  };

  return <PreviewContainer>{previewByType[channel]}</PreviewContainer>;
};
