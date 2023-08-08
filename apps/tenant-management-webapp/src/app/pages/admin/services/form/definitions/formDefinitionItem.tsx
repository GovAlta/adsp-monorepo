import React from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { Edit, OverflowWrap } from '../styled-components';

interface PdfTemplateItemProps {
  pdfTemplate: PdfTemplate;
  onDelete?: (PdfTemplate) => void;
}
export const FormDefinitionItem = ({ pdfTemplate, onDelete }: PdfTemplateItemProps): JSX.Element => {
  return (
    <>
      <tr>
        <td data-testid="pdf-templates-name">{pdfTemplate.name}</td>
        <td data-testid="pdf-templates-template-id">{pdfTemplate.id}</td>
        <td data-testid="pdf-templates-description">
          <OverflowWrap>{pdfTemplate.description}</OverflowWrap>
        </td>
        <td data-testid="pdf-templates-action">
          <Edit></Edit>
        </td>
      </tr>
    </>
  );
};
