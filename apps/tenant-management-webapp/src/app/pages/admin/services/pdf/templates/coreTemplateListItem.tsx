import React from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Edit, OverflowWrap } from '../styled-components';
import { useNavigate } from 'react-router-dom';

interface PdfTemplateItemProps {
  pdfTemplate: PdfTemplate;
}
export const CorePdfTemplateItem = ({ pdfTemplate }: PdfTemplateItemProps): JSX.Element => {
  const navigate = useNavigate();

  return (
    <tr>
      <td data-testid="pdf-templates-name">{pdfTemplate.name}</td>
      <td data-testid="pdf-templates-template-id">{pdfTemplate.id}</td>
      <td data-testid="pdf-templates-description">
        <OverflowWrap>{pdfTemplate.description}</OverflowWrap>
      </td>
    </tr>
  );
};
