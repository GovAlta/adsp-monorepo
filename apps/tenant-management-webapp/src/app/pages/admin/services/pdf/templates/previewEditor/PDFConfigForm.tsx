import React, { useState } from 'react';
import { PdfTemplate } from '@store/pdf/model';

import { GoAIconButton } from '@abgov/react-components-new';

import { PdfConfigFormWrapper } from '../../styled-components';
import DataTable from '@components/DataTable';
import { Edit, PdfInfoTable } from '../../styled-components';
import { AddEditPdfTemplate } from '../addEditPdfTemplates';
import { useDispatch } from 'react-redux';
import { updatePdfTemplate } from '@store/pdf/action';
interface PDFConfigFormProps {
  template: PdfTemplate;
  onChange(template: PdfTemplate): void;
  setError(hasError: boolean): void;
}
export const PDFConfigForm = ({ template, onChange, setError }: PDFConfigFormProps) => {
  const { id, name, description } = template;
  const [openEditPdfTemplate, setOpenEditPdfTemplate] = useState(false);

  const dispatch = useDispatch();
  return (
    <PdfConfigFormWrapper>
      {/* <div className="nameColumn">
        <h4>Name</h4>
        <OverflowWrap>{name}</OverflowWrap>
      </div>

      <div className="idColumn">
        <OverflowWrap>
          {' '}
          <h4>Template ID</h4>
          {id}
        </OverflowWrap>
      </div>

      <div className="descColumn">
        <h4>Description</h4>
        <OverflowWrap>{description}</OverflowWrap>
      </div> */}
      <PdfInfoTable>
        <thead>
          <tr>
            <th data-testid="pdf-templates-table-header-name">Name</th>
            <th id="pdf-templates-template-id" data-testid="pdf-templates-table-header-template-id">
              Template ID
            </th>
            <th id="pdf-templates-Description" data-testid="pdf-templates-table-header-description">
              Description
            </th>
            <th id="pdf-templates-action" data-testid="pdf-templates-table-header-action">
              <Edit>
                <a rel="noopener noreferrer" onClick={() => setOpenEditPdfTemplate(true)}>
                  Edit
                </a>
                <GoAIconButton icon="create" title="Edit" size="small" onClick={() => setOpenEditPdfTemplate(true)} />
              </Edit>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-testid="pdf-templates-table-header-name">{name}</td>
            <td id="pdf-templates-template-id" data-testid="pdf-templates-table-header-template-id">
              {id}
            </td>
            <td id="pdf-templates-Description" data-testid="pdf-templates-table-header-description">
              {description}
            </td>
          </tr>
        </tbody>
      </PdfInfoTable>

      {/* <Edit>
        <a rel="noopener noreferrer" onClick={() => setOpenEditPdfTemplate(true)}>
          Edit
        </a>
        <GoAIconButton icon="create" title="Edit" size="small" onClick={() => setOpenEditPdfTemplate(true)} />
      </Edit> */}
      {openEditPdfTemplate && (
        <AddEditPdfTemplate
          open={openEditPdfTemplate}
          isEdit={true}
          onClose={() => setOpenEditPdfTemplate(false)}
          initialValue={template}
          onSave={(template) => {
            dispatch(updatePdfTemplate(template));
          }}
        />
      )}
    </PdfConfigFormWrapper>
  );
};
