import React from 'react';
import { FormDefinition } from '@store/form/model';
import { OverflowWrap } from '../styled-components';

import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface QueueTableItemProps {
  formDefinition: FormDefinition;
  onDelete?: (FormDefinition) => void;
}

export const QueueTableItem = ({ formDefinition, onDelete }: QueueTableItemProps): JSX.Element => {
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
