import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { CacheTarget } from '../../../../store/cache/model';
import { CacheTargetItem } from './cacheTargetItem';

export interface cacheTargetTableProps {
  targets: Record<string, CacheTarget>;
}

export const CacheTargetTable: FunctionComponent<cacheTargetTableProps> = ({ targets }) => {
  const newTargets = JSON.parse(JSON.stringify(targets));

  return (
    <DataTable data-testid="cache-targets-table">
      <thead data-testid="cache-targets-table-header">
        <tr>
          <th data-testid="cache-targets-table-header-name">Name</th>
          <th id="cache-targets-Description" data-testid="cache-targets-table-header-description">
            Description
          </th>
          <th id="cache-targets-action" data-testid="cache-targets-table-header-action">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(newTargets).map((target) => {
          return <CacheTargetItem target={newTargets[target]} name={target} />;
        })}
      </tbody>
    </DataTable>
  );
};
