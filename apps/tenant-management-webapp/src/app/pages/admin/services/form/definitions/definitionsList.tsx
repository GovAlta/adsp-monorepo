import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { FormDefinitionItem } from './formDefinitionItem';
import { PdfTemplate } from '@store/pdf/model';

export interface PdfTemplatesTableProps {
  definitions: Record<string, PdfTemplate>;
  onDelete?: (PdfTemplate) => void;
  onEdit?: (PdfTemplate) => void;
}
export const FormDefinitionsTable: FunctionComponent<PdfTemplatesTableProps> = ({ definitions, onDelete }) => {
  const newTemplates = JSON.parse(JSON.stringify(definitions));

  return (
    <>
      <DataTable data-testid="pdf-definitions-table">
        <thead data-testid="pdf-definitions-table-header">
          <tr>
            <th data-testid="pdf-definitions-table-header-name">Name</th>
            <th id="pdf-definitions-template-id" data-testid="pdf-definitions-table-header-template-id">
              Definition ID
            </th>
            <th id="pdf-definitions-Description" data-testid="pdf-definitions-table-header-description">
              Description
            </th>
            <th id="pdf-definitions-applicant" data-testid="pdf-definitions-table-header-applicant">
              Applicant Roles
            </th>
            <th id="pdf-definitions-clerk" data-testid="pdf-definitions-table-header-clerk">
              Clerk Roles
            </th>
            <th id="pdf-definitions-assessor" data-testid="pdf-definitions-table-header-assessor">
              Assessor Roles
            </th>
            <th id="pdf-definitions-action" data-testid="pdf-definitions-table-header-action">
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
    </>
  );
};
