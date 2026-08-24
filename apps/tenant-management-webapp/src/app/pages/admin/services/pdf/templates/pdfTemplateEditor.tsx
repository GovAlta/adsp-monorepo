import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useNavigate } from 'react-router-dom';
import { FullScreenEditor } from '@components/FullScreenEditor';
import { useState } from 'react';

export const PdfTemplatesEditor = (): JSX.Element => {
  const navigate = useNavigate();
  const [previewVisible, setPreviewVisible] = useState(true);

  const goBack = () => {
    navigate('/admin/services/pdf?templates=true');
  };

  return (
    <FullScreenEditor
      onGoBack={goBack}
      editor={
        <TemplateEditor
          previewVisible={previewVisible}
          onTogglePreview={() => setPreviewVisible((visible) => !visible)}
        />
      }
      preview={<PreviewTemplate channelTitle="PDF preview" />}
      previewHidden={!previewVisible}
      resizable
    />
  );
};
