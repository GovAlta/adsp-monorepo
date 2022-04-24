import React, { FunctionComponent, useMemo, useState, useEffect } from 'react';
import { NameDiv, TableDiv } from '../styled-components';
import DataTable from '@components/DataTable';
import { ServiceItemComponent } from './definitionListItem';

interface serviceTableProps {
  definitions: Record<string, unknown>;
  tenantName: string;
  onDelete?: (configurationDefinition: any) => void;
}
export const ServiceTableComponent: FunctionComponent<serviceTableProps> = ({ onDelete, definitions, tenantName }) => {
  const nameSpaces: Record<any, any> = {};
  const memoizedSortedConfiguration = Object.keys(definitions)
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
                    <th data-testid="configuration-table-header-name">Name</th>
                    <th id="configuration-action" data-testid="configuration-table-header-action">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nameSpaces[nameSpace].map((configName) => {
                    return (
                      <ServiceItemComponent
                        tenantName={tenantName}
                        configName={configName}
                        nameSpace={nameSpace}
                        onEdit={() => {
                          console.log();
                        }}
                        onDelete={(configurationDefinition) => {
                          onDelete(configurationDefinition);
                        }}
                        configSchema={JSON.stringify(
                          memoizedSortedConfiguration[`${nameSpace}:${configName}`].configurationSchema,
                          null,
                          2
                        )}
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
