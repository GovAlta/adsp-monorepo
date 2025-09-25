import React, { useState } from 'react';
import { FormDefinition } from '../store/form/model';

import { GoAIconButton } from '@abgov/react-components';

import { updateFormDefinition } from '../store/form/action';

import { Edit, ConfigFormWrapper, Anchor } from '../styled';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { useDispatch } from 'react-redux';

interface PDFConfigFormProps {
  definition: FormDefinition;
}
export const FormConfigDefinition = ({ definition }: PDFConfigFormProps) => {
  const { id, name, description } = definition;
  const [openEditFormTemplate, setOpenEditFormTemplate] = useState(false);

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
          <Anchor rel="noopener noreferrer" onClick={() => setOpenEditFormTemplate(true)}>
            Edit
          </Anchor>
          <GoAIconButton
            icon="create"
            testId="form-template-information-edit-icon"
            title="Edit"
            size="small"
            onClick={() => setOpenEditFormTemplate(true)}
          />
        </Edit>
      </div>
      {openEditFormTemplate && (
        <AddEditFormDefinition
          open={openEditFormTemplate}
          isEdit={true}
          onClose={() => setOpenEditFormTemplate(false)}
          initialValue={definition}
          onSave={(definition) => {
            dispatch(updateFormDefinition(definition));
            setOpenEditFormTemplate(false);
          }}
        />
      )}
    </ConfigFormWrapper>
  );
};
