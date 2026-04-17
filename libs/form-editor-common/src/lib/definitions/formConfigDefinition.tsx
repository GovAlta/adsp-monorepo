import React, { useState } from 'react';
import { FormDefinition } from '@store/form/model';

import { GoabIconButton } from '@abgov/react-components';

import { updateFormDefinition, tagFormResource } from '@store/form/action';

import { Edit, ConfigFormWrapper, Anchor } from '../styled-components';
import { AddEditFormDefinition } from './addEditFormDefinition';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Service } from '@store/directory/models';

interface PDFConfigFormProps {
  definition: FormDefinition;
}
export const FormConfigDefinition = ({ definition }: PDFConfigFormProps) => {
  const { id, name, description } = definition;
  const [openEditFormTemplate, setOpenEditFormTemplate] = useState(false);

  const dispatch = useDispatch();

  const CONFIGURATION_SERVICE = 'configuration-service';
  const selectConfigurationHost = (state: RootState) => {
    return (state?.directory?.directory?.filter(
      (y) => y.service === CONFIGURATION_SERVICE && y.namespace?.toLowerCase() === 'platform' && y.urn.endsWith('v2'),
    )[0] ?? []) as Service;
  };
  const resourceConfiguration = useSelector(selectConfigurationHost);
  const BASE_FORM_CONFIG_URN = `${resourceConfiguration.urn}:/configuration/form-service`;
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
          <GoabIconButton
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
          onSave={(definition, tags) => {
            dispatch(updateFormDefinition(definition));
            setOpenEditFormTemplate(false);

            if (tags && tags.length > 0) {
              const urn = `${BASE_FORM_CONFIG_URN}/${definition.id}`;
              tags.forEach((tagLabel) => {
                dispatch(tagFormResource({ urn, label: tagLabel }, false));
              });
            }
          }}
        />
      )}
    </ConfigFormWrapper>
  );
};
