import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchAuditConfiguration } from '@store/audit/actions';
import { DEFAULT_RETENTION_DAYS, RetentionClasses } from '@store/audit/models';
import DataTable from '@components/DataTable';
import { PageIndicator } from '@components/Indicator';
import { TableDiv } from '../styled-components';

const RetentionTable: FunctionComponent<{
  title: string;
  base: Record<string, number>;
  overrides: RetentionClasses;
  testId: string;
}> = ({ title, base, overrides, testId }) => {
  const classNames = Array.from(new Set([...Object.keys(base), ...Object.keys(overrides)])).sort();
  return (
    <TableDiv>
      <div className="group-name">{title}</div>
      <DataTable data-testid={testId}>
        <thead>
          <tr>
            <th>Retention class</th>
            <th>Effective days</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {classNames.map((name) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{overrides[name]?.days ?? base[name]}</td>
              <td>{overrides[name] ? 'Configured' : 'Default'}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </TableDiv>
  );
};

export const AuditRetentionSettings: FunctionComponent = () => {
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => state.session?.indicator);
  const retention = useSelector((state: RootState) => state.audit.retention);

  useEffect(() => {
    dispatch(fetchAuditConfiguration());
  }, [dispatch]);

  if (indicator?.show) {
    return <PageIndicator />;
  }

  const tenantEffective: Record<string, number> = { ...DEFAULT_RETENTION_DAYS };
  Object.entries(retention.tenant).forEach(([name, { days }]) => (tenantEffective[name] = days));

  return (
    <section>
      <RetentionTable
        title="Tenant defaults"
        base={DEFAULT_RETENTION_DAYS}
        overrides={retention.tenant}
        testId="audit-retention-tenant"
      />
      {Object.entries(retention.applications).map(([application, classes]) => (
        <RetentionTable
          key={application}
          title={`Application: ${application}`}
          base={tenantEffective}
          overrides={classes}
          testId={`audit-retention-${application}`}
        />
      ))}
    </section>
  );
};
