import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { CacheTarget } from '../../../../store/cache/model';
import { CacheTargetItem } from './cacheTargetItem';
import { PageIndicator } from '@components/Indicator';

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
            TTL
          </th>
          <th id="cache-targets-action" data-testid="cache-targets-table-header-action">
            Actions
          </th>
        </tr>
      </thead>
      <PageIndicator />
      <tbody>
        {Object.keys(newTargets).map((target, index) => {
          return <CacheTargetItem key={index} target={newTargets[target]} name={target} />;
        })}
      </tbody>
    </DataTable>
  );
};
