import React, { useEffect, useRef, useState } from 'react';

import { ConfigDefinition } from '@store/configuration/model';

import { GoabIconButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';

import { Anchor, Edit, ConfigFormWrapper, Tooltip } from '../styled-components';

import { updatePdfTemplate } from '@store/pdf/action';
import { AddEditConfigDefinition } from '../definitions/addEditDefinition';

import { updateConfigurationDefinition } from '@store/configuration/action';

interface PDFConfigFormProps {
  template: ConfigDefinition;
  id: string;
  isEdit?: boolean;
}
export const ConfigForm = ({ template, id, isEdit = true }: PDFConfigFormProps) => {
  const [namespace, name] = id?.split(':') || [];
  const { description } = template;
  const [openEditTemplate, setOpenEditTemplate] = useState(false);
  const dispatch = useDispatch();
  const [isElipsisActive, setIsElipsisActive] = useState(false);
  const tooltipElem = useRef<HTMLParagraphElement>();
  const [isNameElipsisActive, setIsNameElipsisActive] = useState(false);
  const tooltipNameElem = useRef<HTMLParagraphElement>();
  const [isDescElipsisActive, setIsDescElipsisActive] = useState(false);
  const tooltipDescElem = useRef<HTMLParagraphElement>();
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);

  useEffect(() => {
    const elem = tooltipNameElem.current;

    setIsNameElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  useEffect(() => {
    const elem = tooltipElem.current;

    setIsElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  useEffect(() => {
    const elem = tooltipDescElem.current;

    setIsDescElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);

  const reset = () => {
    setOpenEditTemplate(false);
  };
  return (
    <ConfigFormWrapper data-testid="pdf-config-form">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="template-name">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipNameElem}>
                    {name}
                  </div>
                  {isNameElipsisActive && <p>{name}</p>}
                </Tooltip>
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
              <th>Namespace</th>
            </tr>
            <tr>
              <td data-testid="template-id">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipElem}>
                    {namespace}
                  </div>
                  {isElipsisActive && <p>{namespace}</p>}
                </Tooltip>
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
              <td data-testid="template-description">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipDescElem}>
                    {description}
                  </div>
                  {isDescElipsisActive && <p>{description}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      {isEdit && (
        <div className="editColumn">
          <Edit>
            <Anchor rel="noopener noreferrer" onClick={() => setOpenEditTemplate(true)}>
              Edit
            </Anchor>
            <GoabIconButton
              icon="create"
              testId="pdf-template-information-edit-icon"
              title="Edit"
              size="small"
              onClick={() => setOpenEditTemplate(true)}
            />
          </Edit>
        </div>
      )}
      {openEditTemplate && (
        <AddEditConfigDefinition
          open={isEdit || openEditTemplate}
          onClose={reset}
          isEdit={isEdit}
          initialValue={{ ...template, name, namespace }}
          configurations={{ ...tenantConfigDefinitions?.configuration, ...coreConfigDefinitions?.configuration }}
          onSave={(definition) => {
            dispatch(updateConfigurationDefinition(definition, false, true));
          }}
        />
      )}
    </ConfigFormWrapper>
  );
};
