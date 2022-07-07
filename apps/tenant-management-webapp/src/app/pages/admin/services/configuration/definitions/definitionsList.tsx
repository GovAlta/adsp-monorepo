import React, { FunctionComponent, useMemo } from 'react';
import { NameDiv, TableDiv } from '../styled-components';
import DataTable from '@components/DataTable';
import { ConfigurationDefinitionItemComponent } from './definitionListItem';
import { ConfigDefinition } from '@store/configuration/model';

interface serviceTableProps {
  definitions: Record<string, unknown>;
  tenantName: string;
  isTenantSpecificConfig?: boolean;
  onDelete?: (configurationDefinition: string) => void;
  onEdit?: (configurationDefinition: ConfigDefinition) => void;
}
export const ConfigurationDefinitionsTableComponent: FunctionComponent<serviceTableProps> = ({
  onEdit,
  onDelete,
  definitions,
  tenantName,
  isTenantSpecificConfig,
}) => {
  // to ensure it dosent re-calculate this value if value dosent change
  const nameSpaces: Record<string, string[]> = useMemo(() => {
    return {};
  }, [definitions]);

  // to ensure it dosent re-calculate this value if value dosent change
  const memoizedSortedConfiguration = useMemo(() => {
    return Object.keys(definitions)
      .sort()
      .reduce((obj, key) => {
        obj[key] = definitions[key];
        const nameSpace = key.split(':')[0];
        const name = key.split(':')[1];
        if (nameSpaces[nameSpace]) {
          nameSpaces[nameSpace].push(name);
        } else {
          nameSpaces[nameSpace] = [name];
        }
        return obj;
      }, {});
  }, [definitions]);

  return (
    <>
      {Object.keys(nameSpaces).map((nameSpace) => {
        return (
          <>
            <NameDiv>{nameSpace}</NameDiv>
            <TableDiv key={nameSpace}>
              <DataTable data-testid="configuration-table">
                <thead data-testid="configuration-table-header">
                  <tr>
                    <th id="configuration-name" data-testid="configuration-table-header-name">
                      Name
                    </th>
                    <th data-testid="configuration-table-header-description">Description</th>
                    <th id="configuration-action" data-testid="configuration-table-header-action">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nameSpaces[nameSpace].map((configName) => {
                    return (
                      <ConfigurationDefinitionItemComponent
                        tenantName={tenantName}
                        isTenantSpecificConfig={isTenantSpecificConfig}
                        configName={configName}
                        nameSpace={nameSpace}
                        onDelete={(configurationDefinitionName) => {
                          onDelete(configurationDefinitionName);
                        }}
                        onEdit={(configurationDefinition) => {
                          onEdit(configurationDefinition);
                        }}
                        description={
                          memoizedSortedConfiguration[`${nameSpace}:${configName}`]?.configurationSchema?.description
                        }
                        configSchema={memoizedSortedConfiguration[`${nameSpace}:${configName}`]?.configurationSchema}
                      />
                    );
                  })}
                </tbody>
              </DataTable>
            </TableDiv>
          </>
        );
      })}
    </>
  );
};
