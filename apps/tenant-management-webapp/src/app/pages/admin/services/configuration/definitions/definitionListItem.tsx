import React, { FunctionComponent, useState } from 'react';
import { IconDiv } from '../styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { ConfigDefinition, ConfigurationSchema } from '@store/configuration/model';
import { EntryDetail } from '../../styled-components';
interface serviceItemProps {
  configSchema: ConfigurationSchema;
  configName: string;
  tenantName: string;
  nameSpace: string;
  description: string;
  isCore: boolean;
  anonymousRead: boolean;
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
  description,
  isCore,
  anonymousRead,
  isTenantSpecificConfig,
}) => {
  const [showSchema, setShowSchema] = useState(false);
  return (
    <>
      <tr>
        <td data-testid="configuration-name">{configName}</td>
        <td data-testid="configuration-description">{description}</td>
        <td data-testid="configuration-action" id="configuration-action-icons">
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showSchema ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => setShowSchema(!showSchema)}
                testId="configuration-toggle-details-visibility"
              />
              {(tenantName !== 'Platform' && !isCore) || isTenantSpecificConfig ? (
                <>
                  <GoAContextMenuIcon
                    type="create"
                    title="Edit"
                    onClick={() =>
                      onEdit({
                        namespace: nameSpace,
                        name: configName,
                        description: description,
                        anonymousRead: anonymousRead,
                        configurationSchema: { ...configSchema },
                      })
                    }
                    testId="edit-details"
                  />
                  <GoAContextMenuIcon
                    type="trash"
                    title="Delete"
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
