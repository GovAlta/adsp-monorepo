import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { FormDefinitionItem } from './formDefinitionItem';
import { FormDefinition } from '@store/form/model';

export interface formDefinitionTableProps {
  definitions: Record<string, FormDefinition>;
  baseResourceFormUrn: string;
  onDelete?: (FormDefinition) => void;
  onEdit?: (FormDefinition) => void;
  onAddResourceTag?: (FormDefinition) => void;
}

export const FormDefinitionsTable: FunctionComponent<formDefinitionTableProps> = ({
  definitions,
  baseResourceFormUrn,
  onDelete,
  onAddResourceTag,
}) => {
  const newTemplates = JSON.parse(JSON.stringify(definitions));

  return (
    <DataTable data-testid="form-definitions-table">
      <thead data-testid="form-definitions-table-header">
        <tr>
          <th data-testid="form-definitions-table-header-name">Name</th>
          <th id="form-definitions-Description" data-testid="form-definitions-table-header-description">
            Description
          </th>
          <th id="form-definitions-action" data-testid="form-definitions-table-header-action">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(newTemplates)
          .sort()
          .map((templateName) => {
            return (
              <FormDefinitionItem
                key={templateName}
                baseResourceFormUrn={baseResourceFormUrn}
                formDefinition={newTemplates[templateName]}
                onDelete={onDelete}
                onAddResourceTag={onAddResourceTag}
              />
            );
          })}
      </tbody>
    </DataTable>
  );
};
