import React, { FunctionComponent, useMemo, useState, useEffect } from 'react';
import { IconDiv, EntryDetail } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface serviceItemProps {
  configSchema: string;
  configName: string;
}

export const ServiceItemComponent: FunctionComponent<serviceItemProps> = ({ configSchema, configName }) => {
  const [showSchema, setShowSchema] = useState(false);
  console.log('configName', configName);
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
