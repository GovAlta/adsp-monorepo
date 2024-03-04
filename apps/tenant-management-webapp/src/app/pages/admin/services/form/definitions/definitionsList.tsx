import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { FormDefinitionItem } from './formDefinitionItem';
import { PdfTemplate } from '@store/pdf/model';

export interface formDefinitionTableProps {
  definitions: Record<string, PdfTemplate>;
  onDelete?: (PdfTemplate) => void;
  onEdit?: (PdfTemplate) => void;
}
export const FormDefinitionsTable: FunctionComponent<formDefinitionTableProps> = ({ definitions, onDelete }) => {
  const newTemplates = JSON.parse(JSON.stringify(definitions));

  return (
      <DataTable data-testid="form-definitions-table">
        <thead data-testid="form-definitions-table-header">
          <tr>
            <th data-testid="form-definitions-table-header-name">Name</th>
            <th id="form-definitions-template-id" data-testid="form-definitions-table-header-template-id">
              Definition ID
            </th>
            <th id="form-definitions-Description" data-testid="form-definitions-table-header-description">
              Description
            </th>
            <th id="form-definitions-action" data-testid="form-definitions-table-header-action">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(newTemplates).map((templateName) => {
            return (
              <FormDefinitionItem key={templateName} formDefinition={newTemplates[templateName]} onDelete={onDelete} />
            );
          })}
        </tbody>
      </DataTable>
  );
};
