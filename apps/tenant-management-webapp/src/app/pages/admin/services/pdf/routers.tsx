import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Pdf } from './pdf';
import { PdfTemplatesEditor } from './templates/pdfTemplateEditor';

export const PDFRouter = () => {
  return (
    <Routes>
      <Route index element={<Pdf />} />
      <Route path="/edit/:id" element={<PdfTemplatesEditor />} />
    </Routes>
  );
};
