import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchAuditConfiguration } from '@store/audit/actions';
import type { AuditAction } from '@store/audit/models';
import DataTable from '@components/DataTable';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { EntryDetail, TableDiv } from '../styled-components';

const yesNo = (value?: boolean) => (value ? 'Yes' : 'No');

const ActionRow: FunctionComponent<{ action: AuditAction }> = ({ action }) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <tr>
        <td data-testid="audit-action-name">{action.name}</td>
        <td>{action.category}</td>
        <td>{action.severity}</td>
        <td>{action.retentionClass}</td>
        <td>{yesNo(action.forwardToSiem)}</td>
        <td>{yesNo(action.captureChangeSet)}</td>
        <td>
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowDetails(!showDetails)}
              testId="audit-toggle-details"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={7}>
            <EntryDetail data-testid="audit-action-details">
              {JSON.stringify(
                {
                  version: action.version,
                  description: action.description,
                  resourceType: action.resourceType,
                  metadataSchema: action.metadataSchema,
                },
                null,
                2,
              )}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

export const AuditCatalogs: FunctionComponent = () => {
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => state.session?.indicator);
  const catalogs = useSelector((state: RootState) => state.audit.catalogs);

  useEffect(() => {
    dispatch(fetchAuditConfiguration());
  }, [dispatch]);

  if (indicator?.show) {
    return <PageIndicator />;
  }
  if (catalogs.length === 0) {
    return renderNoItem('audit catalog');
  }

  return (
    <section>
      {catalogs.map((catalog) => (
        <TableDiv key={catalog.application}>
          <div className="group-name">
            {catalog.application}
            {catalog.isCore ? ' (core)' : ''}
          </div>
          <DataTable data-testid={`audit-catalog-${catalog.application}`}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Retention class</th>
                <th>SIEM</th>
                <th>Change set</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {catalog.actions.map((action) => (
                <ActionRow key={action.name} action={action} />
              ))}
            </tbody>
          </DataTable>
        </TableDiv>
      ))}
    </section>
  );
};
