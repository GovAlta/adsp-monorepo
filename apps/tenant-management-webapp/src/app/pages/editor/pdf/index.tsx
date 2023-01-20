import React, { FunctionComponent, useContext, useEffect } from 'react';
import { HeaderCtx } from '@lib/headerContext';
import { useLocation } from 'react-router-dom';
import { PdfTemplatesEditor } from '@pages/admin/services/pdf/templates/pdfTemplateEditor';

export const PdfEditor: FunctionComponent = () => {
  const { setTitle } = useContext(HeaderCtx);

  useEffect(() => {
    setTitle('Alberta Digital Service Platform - Tenant management');
  }, [setTitle]);
  const location = useLocation();
  const locationParser = JSON.parse(JSON.stringify(location.state));

  return (
    <PdfTemplatesEditor passedTemplate={locationParser['currentTemplate']} showTemplateForm={true}></PdfTemplatesEditor>
  );
};
