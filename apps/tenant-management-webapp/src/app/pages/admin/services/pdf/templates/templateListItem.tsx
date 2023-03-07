import React, { FunctionComponent } from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Edit, OverflowWrap } from '../styled-components';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoABadge } from '@abgov/react-components/experimental';
import { useRouteMatch } from 'react-router';
import { useHistory } from 'react-router-dom';

interface PdfTemplateItemProps {
  pdfTemplate: PdfTemplate;
  onDelete?: (PdfTemplate) => void;
}
export const PdfTemplateItem: FunctionComponent<PdfTemplateItemProps> = ({ pdfTemplate, onDelete }) => {
  const { url } = useRouteMatch();
  const history = useHistory();

  return (
    <>
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
                onClick={() => history.push(`${url}/edit/${pdfTemplate.id}`)}
                testId={`edit-pdf-item`}
              />
              <GoAIconButton
                testId={`pdf-template-delete`}
                title="Delete"
                size="medium"
                type="trash"
                onClick={() => onDelete(pdfTemplate)}
              />
            </div>
          </Edit>
        </td>
      </tr>
    </>
  );
};
