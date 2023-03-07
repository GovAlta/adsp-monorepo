import React, { useState } from 'react';
import { PdfTemplate } from '@store/pdf/model';

import { GoAIconButton } from '@abgov/react-components-new';

import { Edit, PdfConfigFormWrapper } from '../../styled-components';
import { AddEditPdfTemplate } from '../addEditPdfTemplates';
import { useDispatch } from 'react-redux';
import { updatePdfTemplate } from '@store/pdf/action';

interface PDFConfigFormProps {
  template: PdfTemplate;
}
export const PDFConfigForm = ({ template }: PDFConfigFormProps) => {
  const { id, name, description } = template;
  const [openEditPdfTemplate, setOpenEditPdfTemplate] = useState(false);

  const dispatch = useDispatch();
  return (
    <PdfConfigFormWrapper>
      <div className="nameColumn">
        <table>
          <tr>
            <th>Name</th>
          </tr>
          <tr>
            <td>{name}</td>
          </tr>
        </table>
      </div>
      <div className="separator"></div>
      <div className="idColumn">
        <table>
          <tr>
            <th>Template ID</th>
          </tr>
          <tr>
            <td>{id}</td>
          </tr>
        </table>
      </div>
      <div className="separator"></div>
      <div className="descColumn">
        <table>
          <tr>
            <th>Description</th>
          </tr>
          <tr>
            <td>{description}</td>
          </tr>
        </table>
      </div>
      <div className="editColumn">
        <Edit>
          <a rel="noopener noreferrer" onClick={() => setOpenEditPdfTemplate(true)}>
            Edit
          </a>
          <GoAIconButton
            icon="create"
            testId="pdf-template-information-edit-icon"
            title="Edit"
            size="small"
            onClick={() => setOpenEditPdfTemplate(true)}
          />
        </Edit>
      </div>
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
