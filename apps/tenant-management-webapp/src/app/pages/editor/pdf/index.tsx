import React, { FunctionComponent } from 'react';

import { useLocation } from 'react-router-dom';
import { PdfTemplatesEditor } from '@pages/admin/services/pdf/templates/pdfTemplateEditor';

export const PdfEditor: FunctionComponent = () => {
  const location = useLocation();
  const locationParser = JSON.parse(JSON.stringify(location.state));

  return <PdfTemplatesEditor passedTemplate={locationParser['currentTemplate']}></PdfTemplatesEditor>;
};
