import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { useSelector } from 'react-redux';
import { CacheTarget } from '../../../../store/cache/model';
import { CacheTargetItem } from './cacheTargetItem';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';

export interface cacheTargetTableProps {
  targets: Record<string, CacheTarget>;
  openModalFunction?: (target: CacheTarget) => void;
  onDeleteTarget?: (target: CacheTarget) => void;
  tenantMode?: boolean;
}

export const CacheTargetTable: FunctionComponent<cacheTargetTableProps> = ({
  targets,
  openModalFunction,
  onDeleteTarget,
  tenantMode,
}) => {
  const newTargets = JSON.parse(JSON.stringify(targets));

  const indicator = useSelector((state: RootState) => state?.session?.indicator);

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
      {indicator && <PageIndicator />}
      <tbody>
        {Object.keys(newTargets).map((target, index) => {
          return (
            <CacheTargetItem
              key={index}
              target={newTargets[target]}
              name={target}
              openModalFunction={openModalFunction}
              onDeleteTarget={onDeleteTarget}
              tenantMode={tenantMode}
            />
          );
        })}
      </tbody>
    </DataTable>
  );
};
