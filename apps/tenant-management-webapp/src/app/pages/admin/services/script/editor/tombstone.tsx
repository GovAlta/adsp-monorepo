import React, { useEffect, useRef, useState } from 'react';

import { TombStoneWrapper, Edit, Tooltip } from '../styled-components';
import { ScriptItem } from '@store/script/models';
import { GoAIconButton } from '@abgov/react-components-new';
import { AddScriptModal } from '../addScriptModal';

import { useSelector } from 'react-redux';
import { tenantRolesAndClients } from '@store/sharedSelectors/roles';

interface props {
  selectedScript: ScriptItem;
  onSave;
}
export const TombStone = ({ selectedScript, onSave }: props): JSX.Element => {
  const [openAddScript, setOpenAddScript] = useState(false);
  const tenant = useSelector(tenantRolesAndClients);
  const [isNameElipsisActive, setIsNameElipsisActive] = useState(false);
  const tooltipNameElem = useRef<HTMLParagraphElement>();
  const [isIdElipsisActive, setIsIdElipsisActive] = useState(false);
  const tooltipIdElem = useRef<HTMLParagraphElement>();
  const [isDescElipsisActive, setIsDescElipsisActive] = useState(false);
  const tooltipDescElem = useRef<HTMLParagraphElement>();
  useEffect(() => {
    const elem = tooltipNameElem.current;
    setIsNameElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  useEffect(() => {
    const elem = tooltipNameElem.current;
    setIsIdElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  useEffect(() => {
    const elem = tooltipNameElem.current;
    setIsDescElipsisActive(elem ? elem.offsetWidth < elem.scrollWidth || elem.offsetHeight < elem.scrollHeight : false);
  }, []);
  return (
    <TombStoneWrapper data-testid="task-config-form">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="queue-namespace">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipNameElem}>
                    {selectedScript.name}
                  </div>
                  {isNameElipsisActive && <p>{selectedScript.name}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Sctipt ID</th>
            </tr>
            <tr>
              <td data-testid="queue-namespace">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipIdElem}>
                    {selectedScript.id}
                  </div>
                  {isIdElipsisActive && <p>{selectedScript.id}</p>}
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
              <td data-testid="queue-name">
                <Tooltip>
                  <div className="overflowContainer" ref={tooltipDescElem}>
                    {selectedScript.description}
                  </div>
                  {isDescElipsisActive && <p>{selectedScript.description}</p>}
                </Tooltip>
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="editColumn">
        <Edit>
          <a rel="noopener noreferrer" onClick={() => setOpenAddScript(true)}>
            Edit
          </a>
          <GoAIconButton
            icon="create"
            testId="form-template-information-edit-icon"
            title="Edit"
            size="small"
            onClick={() => setOpenAddScript(true)}
          />
        </Edit>
      </div>
      {openAddScript && (
        <AddScriptModal
          open={openAddScript}
          isNew={false}
          initialValue={selectedScript}
          onCancel={() => {
            setOpenAddScript(false);
          }}
          onSave={onSave}
        />
      )}
    </TombStoneWrapper>
  );
};
