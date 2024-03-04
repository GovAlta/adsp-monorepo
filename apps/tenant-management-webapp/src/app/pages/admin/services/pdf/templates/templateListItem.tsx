import React from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Edit, OverflowWrap } from '../styled-components';
import { useNavigate } from 'react-router-dom-6';

interface PdfTemplateItemProps {
  pdfTemplate: PdfTemplate;
  onDelete?: (PdfTemplate) => void;
}
export const PdfTemplateItem = ({ pdfTemplate, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const navigate = useNavigate();

  return (
      <tr>
        <td data-testid="pdf-templates-name">{pdfTemplate.name}</td>
        <td data-testid="pdf-templates-template-id">{pdfTemplate.id}</td>
        <td data-testid="pdf-templates-description">
          <OverflowWrap>{pdfTemplate.description}</OverflowWrap>
        </td>
        <td data-testid="pdf-templates-action">
          <Edit>
            <div className="flexRow">
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                onClick={() => navigate(`edit/${pdfTemplate.id}`)}
                testId={`edit-pdf-item`}
              />
              <GoAContextMenuIcon
                testId={`pdf-template-delete`}
                title="Delete"
                type="trash"
                onClick={() => onDelete(pdfTemplate)}
              />
            </div>
          </Edit>
        </td>
      </tr>
  );
};
