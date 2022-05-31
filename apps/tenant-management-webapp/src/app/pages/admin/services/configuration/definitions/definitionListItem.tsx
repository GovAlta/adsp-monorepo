import React, { FunctionComponent, useState } from 'react';
import { IconDiv, EntryDetail } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { ConfigDefinition, ConfigurationSchema } from '@store/configuration/model';

interface serviceItemProps {
  configSchema: ConfigurationSchema;
  configName: string;
  tenantName: string;
  nameSpace: string;
  isTenantSpecificConfig?: boolean;
  onEdit: (definition: ConfigDefinition) => void;
  onDelete: (definitionName: string) => void;
}

export const ConfigurationDefinitionItemComponent: FunctionComponent<serviceItemProps> = ({
  configSchema,
  configName,
  onEdit,
  onDelete,
  tenantName,
  nameSpace,
  isTenantSpecificConfig,
}) => {
  const [showSchema, setShowSchema] = useState(false);
  return (
    <>
      <tr>
        <td data-testid="configuration-name">{configName}</td>
        <td>
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showSchema ? 'eye-off' : 'eye'}
                onClick={() => setShowSchema(!showSchema)}
                testId="configuration-toggle-details-visibility"
              />
              {tenantName !== 'Platform' || isTenantSpecificConfig ? (
                <>
                  <GoAContextMenuIcon
                    type="create"
                    onClick={() =>
                      onEdit({
                        namespace: nameSpace,
                        name: configName,
                        payloadSchema: { ...configSchema },
                      })
                    }
                    testId="edit-details"
                  />
                  <GoAContextMenuIcon
                    type="trash"
                    onClick={() => onDelete(`${nameSpace}:${configName}`)}
                    testId="delete-config"
                  />
                </>
              ) : (
                ''
              )}
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
            <EntryDetail data-testid="configuration-details">{JSON.stringify(configSchema, null, 2)}</EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
