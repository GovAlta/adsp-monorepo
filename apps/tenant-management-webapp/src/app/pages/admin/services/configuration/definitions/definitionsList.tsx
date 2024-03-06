import React, { FunctionComponent, useMemo } from 'react';
import { NameDiv, TableDiv } from '../styled-components';
import DataTable from '@components/DataTable';
import { ConfigurationDefinitionItemComponent } from './definitionListItem';
import { ConfigDefinition } from '@store/configuration/model';
import { sortConfigDefinitions } from '../utils';

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
  }, [definitions]); // eslint-disable-line react-hooks/exhaustive-deps

  // to ensure it dosent re-calculate this value if value dosent change
  const memoizedReducedConfiguration = useMemo(() => {
    return Object.keys(definitions).reduce((obj, key) => {
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
  }, [definitions]); // eslint-disable-line react-hooks/exhaustive-deps

  // sorting data by namespaces and sort definition names under each namespace
  const sortedNamespaces: Record<string, string[]> = useMemo(() => {
    return sortConfigDefinitions(nameSpaces);
  }, [definitions]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {Object.keys(sortedNamespaces).map((nameSpace) => {
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
                  {sortedNamespaces[nameSpace].map((configName) => {
                    const sortedConfig = memoizedReducedConfiguration[`${nameSpace}:${configName}`];
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
                        description={sortedConfig?.description}
                        configSchema={sortedConfig?.configurationSchema}
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
