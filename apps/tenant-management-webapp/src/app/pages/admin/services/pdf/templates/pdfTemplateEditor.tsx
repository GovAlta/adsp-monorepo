import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useNavigate } from 'react-router-dom';
import { FullScreenEditor } from '@components/FullScreenEditor';

export const PdfTemplatesEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/pdf?templates=true');
  };

  return (
    <FullScreenEditor
      onGoBack={goBack}
      editor={<TemplateEditor />}
      preview={<PreviewTemplate channelTitle="PDF preview" />}
    />
  );
};
