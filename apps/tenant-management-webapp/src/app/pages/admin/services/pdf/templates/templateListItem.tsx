import React, { FunctionComponent, useState } from 'react';
import { PdfTemplate } from '@store/pdf/model';

interface PdfTemplateItemProps {
  pdfTemplate: PdfTemplate;
}
export const PdfTemplateItem: FunctionComponent<PdfTemplateItemProps> = ({ pdfTemplate }) => {
  return (
    <>
      <tr>
        <td data-testid="pdf-templates-name">{pdfTemplate.name}</td>
        <td data-testid="pdf-templates-template-id">{pdfTemplate.id}</td>
        <td data-testid="pdf-templates-description">{pdfTemplate.description}</td>
        <td data-testid="pdf-templates-action"></td>
      </tr>
    </>
  );
};
