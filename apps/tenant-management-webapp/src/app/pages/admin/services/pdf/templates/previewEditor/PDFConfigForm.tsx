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
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td className="overflowContainer">{name}</td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="idColumn">
        <table>
          <thead>
            <tr>
              <th>Template ID</th>
            </tr>
            <tr>
              <td className="overflowContainer">{id}</td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="descColumn">
        <table>
          <thead>
            <tr>
              <th>Description</th>
            </tr>
            <tr>
              <td>
                <div className="overflowContainer"> {description}</div>
              </td>
            </tr>
          </thead>
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
