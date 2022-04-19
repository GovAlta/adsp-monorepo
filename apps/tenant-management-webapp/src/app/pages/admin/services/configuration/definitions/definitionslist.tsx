import React, { FunctionComponent, useMemo, useState, useEffect } from 'react';
import { NameDiv, TableDiv } from '../styled-components';
import DataTable from '@components/DataTable';
import { ServiceItemComponent } from './definitionListItem';

interface serviceTableProps {
  definitions: Record<string, unknown>;
}
export const ServiceTableComponent: FunctionComponent<serviceTableProps> = ({ definitions }) => {
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
      {Object.keys(nameSpaces).map((name) => {
        return (
          <>
            <NameDiv>{name}</NameDiv>
            <TableDiv key={name}>
              <DataTable data-testid="configuration-table">
                <thead data-testid="configuration-table-header">
                  <tr>
                    <th id="c" data-testid="configuration-table-header-name">
                      Name
                    </th>
                    <th id="configuration-action" data-testid="configuration-table-header-action">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nameSpaces[name].map((configName) => {
                    return (
                      <ServiceItemComponent
                        configName={configName}
                        configSchema={JSON.stringify(
                          memoizedSortedConfiguration[`${name}:${configName}`].configurationSchema,
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
