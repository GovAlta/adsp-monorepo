import React, { useState } from 'react';
import { FormDefinition } from './model';
import { GoAIconButton } from '@abgov/react-components';
import { Edit, ConfigFormWrapper, Anchor } from '../styled-components';
import { AddEditFormDefinition } from './addEditFormDefinition';

interface PDFConfigFormProps {
  definition: FormDefinition;
  renameAct: (editActTarget: any, newName: any) => void;
  updateFormDefinition: (definition: FormDefinition) => void;
  definitions: Record<string,FormDefinition>;
  indicator: any;
  defaultFormUrl: string;
}
export const FormConfigDefinition = ({
  definition,
  renameAct,
  updateFormDefinition,
  definitions,
  indicator,
  defaultFormUrl,
}: PDFConfigFormProps) => {
  const { id, name, description } = definition;
  const [openEditFormTemplate, setOpenEditFormTemplate] = useState(false);

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
            updateFormDefinition(definition);
            setOpenEditFormTemplate(false);
          }}
          renameAct={renameAct}
          definitions={definitions}
          indicator={indicator}
          defaultFormUrl={defaultFormUrl}
        />
      )}
    </ConfigFormWrapper>
  );
};
