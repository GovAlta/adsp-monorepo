import { TemplateEditor } from './previewEditor/TemplateEditor';
import { PreviewTemplate } from './previewEditor/PreviewTemplate';
import { useNavigate } from 'react-router-dom';
import { FullScreenEditor } from '@components/FullScreenEditor';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

export const PdfTemplatesEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/pdf?templates=true');
  };

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const isNotificationActive = latestNotification && !latestNotification.disabled;

  return (
    <FullScreenEditor
      onGoBack={goBack}
      editor={<TemplateEditor />}
      preview={<PreviewTemplate channelTitle="PDF preview" />}
    />
  );
};
