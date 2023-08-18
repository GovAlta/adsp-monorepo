import React from 'react';
import { FormDefinition } from '@store/form/model';
import { OverflowWrap } from '../styled-components';

import { useRouteMatch } from 'react-router';
import { useHistory } from 'react-router-dom';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface PdfTemplateItemProps {
  formDefinition: FormDefinition;
  onDelete?: (FormDefinition) => void;
}

export const FormDefinitionItem = ({ formDefinition, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const { url } = useRouteMatch();
  const history = useHistory();
  return (
    <>
      <tr>
        <td data-testid="form-definitions-name">{formDefinition.name}</td>
        <td data-testid="form-definitions-template-id">{formDefinition.id}</td>
        <td data-testid="form-definitions-description">
          <OverflowWrap>{formDefinition.description}</OverflowWrap>
        </td>
        <td data-testid="form-definitions-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              testId="form-definition-edit"
              title="Edit"
              type="create"
              onClick={() => history.push(`${url}/edit/${formDefinition.id}`)}
            />
            <GoAContextMenuIcon
              testId={`form-definition-delete`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(formDefinition)}
            />
          </GoAContextMenu>
        </td>
      </tr>
    </>
  );
};
