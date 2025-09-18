import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { NameDiv, TableDiv } from '../../styled-components';
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

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);
  const isCoreDefinition = () => {
    let isCore = false;
    const definitionsLength = Object.keys(definitions).length;
    if (definitions && definitionsLength > 0) {
      const configObjects = Object.keys(definitions);
      isCore = !configObjects[0].includes('platform:') || !configObjects[0].includes('form-service:');
    }
    return isCore;
  };

  // to ensure it doesnt re-calculate this value if value dosent change
  const memoizedReducedConfiguration = useMemo(() => {
    return Object.keys(definitions ?? []).reduce((obj, key) => {
      obj[key] = definitions[key];
      const parts = key.split(':');
      const nameSpace = parts[0];
      const name = parts.length > 1 ? parts[1] : parts[0];
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
          <div key={nameSpace}>
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
                    const sortedConfig =
                      memoizedReducedConfiguration[`${nameSpace}:${configName}`] ||
                      memoizedReducedConfiguration[`${configName}`];
                    return (
                      <ConfigurationDefinitionItemComponent
                        key={`${configName}-${nameSpace}`}
                        tenantName={tenantName}
                        isCore={isCoreDefinition()}
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
                        anonymousRead={sortedConfig?.anonymousRead}
                        configSchema={sortedConfig?.configurationSchema}
                      />
                    );
                  })}
                </tbody>
              </DataTable>
            </TableDiv>
          </div>
        );
      })}
    </>
  );
};
