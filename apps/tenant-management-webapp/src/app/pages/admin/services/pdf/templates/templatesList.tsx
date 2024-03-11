import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { PdfTemplateItem } from './templateListItem';
import { PdfTemplate } from '@store/pdf/model';

export interface PdfTemplatesTableProps {
  templates: Record<string, PdfTemplate>;
  onDelete?: (PdfTemplate) => void;
}
export const PdfTemplatesTable: FunctionComponent<PdfTemplatesTableProps> = ({ templates, onDelete }) => {
  const newTemplates = JSON.parse(JSON.stringify(templates));

  return (
    <DataTable data-testid="pdf-templates-table">
      <thead data-testid="pdf-templates-table-header">
        <tr>
          <th data-testid="pdf-templates-table-header-name">Name</th>
          <th id="pdf-templates-template-id" data-testid="pdf-templates-table-header-template-id">
            Template ID
          </th>
          <th id="pdf-templates-Description" data-testid="pdf-templates-table-header-description">
            Description
          </th>
          <th id="pdf-templates-action" data-testid="pdf-templates-table-header-action">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(newTemplates).map((templateName) => {
          return <PdfTemplateItem key={templateName} pdfTemplate={newTemplates[templateName]} onDelete={onDelete} />;
        })}
      </tbody>
    </DataTable>
  );
};
