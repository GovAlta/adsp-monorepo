import React, { useState } from 'react';
import { FormDefinition } from '@store/form/model';
import { OverflowWrap, EntryDetail } from '../styled-components';
import { useNavigate } from 'react-router-dom-6';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface PdfTemplateItemProps {
  formDefinition: FormDefinition;
  onDelete?: (FormDefinition) => void;
}

export const FormDefinitionItem = ({ formDefinition, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const [showSchema, setShowSchema] = useState(false);
  const formDescription =
    formDefinition.description?.length > 80
      ? formDefinition.description?.substring(0, 80) + '...'
      : formDefinition.description;
  const navigate = useNavigate();
  return (
    <>
      <tr>
        <td data-testid="form-definitions-name">{formDefinition.name}</td>
        <td data-testid="form-definitions-template-id">{formDefinition.id}</td>
        <td data-testid="form-definitions-description">
          <OverflowWrap>{formDescription}</OverflowWrap>
        </td>
        <td data-testid="form-definitions-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showSchema ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowSchema(!showSchema)}
              testId="configuration-toggle-details-visibility"
            />
            <GoAContextMenuIcon
              testId="form-definition-edit"
              title="Edit"
              type="create"
              onClick={() => navigate(`edit/${formDefinition.id}`)}
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
      {showSchema && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: '0px',
            }}
          >
            <EntryDetail data-testid="configuration-details">
              {JSON.stringify(formDefinition.dataSchema, null, 2)}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
