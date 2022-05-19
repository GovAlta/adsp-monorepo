import React, { FunctionComponent } from 'react';
import { PdfTemplate } from '@store/pdf/model';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import styled from 'styled-components';

import { GoAInfoBadge, GoABadge } from '@abgov/react-components/experimental';

interface PdfTemplateItemProps {
  pdfTemplate: PdfTemplate;
  edit?: (PdfTemplate) => void;
}
export const PdfTemplateItem: FunctionComponent<PdfTemplateItemProps> = ({ pdfTemplate, edit }) => {
  return (
    <>
      <tr>
        <td data-testid="pdf-templates-name">{pdfTemplate.name}</td>
        <td data-testid="pdf-templates-template-id">{pdfTemplate.id}</td>
        <td data-testid="pdf-templates-description">{pdfTemplate.description}</td>
        <td data-testid="pdf-templates-action">
          <Edit>
            <div className="flexRow">
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                onClick={() => edit(pdfTemplate)}
                testId={`edit-subscription-item-${pdfTemplate.name}`}
              />
              <div className="badgePadding">
                {pdfTemplate.template?.length === 0 && <GoABadge type="warning" content="Unfilled" icon="warning" />}
              </div>
            </div>
          </Edit>
        </td>
      </tr>
    </>
  );
};

const Edit = styled.div`
  .flexRow {
    display: flex;
    flex-direction: row;
  }

  .badgePadding {
    margin: 6px 0 0 5px;
  }

  display: flex;
`;
