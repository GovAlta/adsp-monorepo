import React, { FunctionComponent, useMemo, useState, useEffect } from 'react';
import { IconDiv, EntryDetail } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface serviceItemProps {
  configSchema: string;
  configName: string;
  tenantName: string;
  nameSpace: string;
  onEdit: (definition: any) => void;
  onDelete: (definition: any) => void;
}

export const ServiceItemComponent: FunctionComponent<serviceItemProps> = ({
  configSchema,
  configName,
  onEdit,
  onDelete,
  tenantName,
  nameSpace,
}) => {
  const [showSchema, setShowSchema] = useState(false);
  return (
    <>
      <tr>
        <td data-testid="config-name">{configName}</td>
        <td>
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showSchema ? 'eye-off' : 'eye'}
                onClick={() => setShowSchema(!showSchema)}
                testId="configuration-toggle-details-visibility"
              />
            </GoAContextMenu>
            {tenantName !== 'Platform' ? (
              <>
                <GoAContextMenuIcon type="create" onClick={() => onEdit('definition')} testId="edit-details" />
                <GoAContextMenuIcon
                  type="trash"
                  onClick={() => onDelete(`${nameSpace}:${configName}`)}
                  testId="delete-details"
                />
              </>
            ) : (
              ''
            )}
          </IconDiv>
        </td>
      </tr>
      {showSchema && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '0px',
            }}
          >
            <EntryDetail data-testid="configuration-details">{configSchema}</EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
