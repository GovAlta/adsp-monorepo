import React, { useState } from 'react';
import { PdfTemplate } from '@store/pdf/model';

import { GoAIconButton } from '@abgov/react-components-new';

import { PdfConfigFormWrapper } from '../../styled-components';

import { Edit, OverflowWrap } from '../../styled-components';
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
      <div className="nameColumn">
        <h4>Name</h4>
        <OverflowWrap>{name}</OverflowWrap>
      </div>

      <div className="idColumn">
        <h4>Template ID</h4>

        {id}
      </div>

      <div className="descColumn">
        <h4>Description</h4>
        <OverflowWrap>{description}</OverflowWrap>
      </div>
      <div className="editColumn">
        <Edit>
          <a rel="noopener noreferrer" onClick={() => setOpenEditPdfTemplate(true)}>
            Edit
          </a>
          <GoAIconButton icon="create" title="Edit" size="small" onClick={() => setOpenEditPdfTemplate(true)} />
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
