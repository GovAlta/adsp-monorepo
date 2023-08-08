import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { FormDefinitionItem } from './formDefinitionItem';
import { PdfTemplate } from '@store/pdf/model';

export interface PdfTemplatesTableProps {
  definitions: Record<string, PdfTemplate>;
  onDelete?: (PdfTemplate) => void;
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
              Template ID
            </th>
            <th id="pdf-definitions-Description" data-testid="pdf-definitions-table-header-description">
              Description
            </th>
            <th id="pdf-definitions-action" data-testid="pdf-definitions-table-header-action">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(newTemplates).map((templateName) => {
            return (
              <FormDefinitionItem key={templateName} pdfTemplate={newTemplates[templateName]} onDelete={onDelete} />
            );
          })}
        </tbody>
      </DataTable>
    </>
  );
};
