import React, { useState } from 'react';
import { FormDefinition } from '@store/form/model';

import { GoAIconButton } from '@abgov/react-components-new';

import { updateFormDefinition } from '@store/form/action';

import { Edit, ConfigFormWrapper } from '../styled-components';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { useDispatch } from 'react-redux';

interface PDFConfigFormProps {
  definition: FormDefinition;
}
export const FormConfigDefinition = ({ definition }: PDFConfigFormProps) => {
  const { id, name, description } = definition;
  const [openEditPdfTemplate, setOpenEditPdfTemplate] = useState(false);

  const dispatch = useDispatch();
  return (
    <ConfigFormWrapper data-testid="form-config-form">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="template-name" className="overflowContainer">
                {name}
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="idColumn">
        <table>
          <thead>
            <tr>
              <th>Definition ID</th>
            </tr>
            <tr>
              <td data-testid="template-id" className="overflowContainer">
                {id}
              </td>
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
                <div data-testid="template-description" className="overflowContainer">
                  {' '}
                  {description}
                </div>
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
        <AddEditFormDefinition
          open={openEditPdfTemplate}
          isEdit={true}
          onClose={() => setOpenEditPdfTemplate(false)}
          initialValue={definition}
          onSave={(definition) => {
            dispatch(updateFormDefinition(definition));
          }}
        />
      )}
    </ConfigFormWrapper>
  );
};
