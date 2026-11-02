import React, { FunctionComponent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Page, Main, Aside, AsidePadding } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import AsideLinks from '@components/AsideLinks';
import { Overview } from '@components/Overview';
import { AuditCatalogs } from './catalogs';
import { AuditLogs } from './logs';
import { AuditRetentionSettings } from './retention';

export const AUDIT_TABS = ['overview', 'logs', 'catalogs', 'retention'];

export const Audit: FunctionComponent = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  // Tabs are URL-driven so returning from an event's detail page lands on the Logs tab.
  const activeIndex = Math.max(AUDIT_TABS.indexOf(tab ?? ''), 0);

  return (
    <Page>
      <Main>
        <h1 data-testid="audit-title">Audit service</h1>
        <Tabs
          activeIndex={activeIndex}
          changeTabCallback={(index) => navigate(`/admin/services/audit/${AUDIT_TABS[index]}`)}
        >
          <Tab label="Overview" data-testid="audit-service-overview-tab">
            <Overview
              service="audit"
              config={{
                addButton: undefined,
                description: {
                  content: [
                    'The audit service records who did what, and when, across your applications. Each application registers a catalog of the actions it audits, and each action is assigned a retention class that determines how long its events are kept.',
                    'This view is read-only. Catalogs and retention settings are managed through the configuration service.',
                  ],
                },
              }}
            />
          </Tab>
          <Tab label="Logs" data-testid="audit-service-logs-tab">
            <AuditLogs />
          </Tab>
          <Tab label="Catalogs" data-testid="audit-service-catalogs-tab">
            <AuditCatalogs />
          </Tab>
          <Tab label="Retention" data-testid="audit-service-retention-tab">
            <AuditRetentionSettings />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsidePadding>
          <AsideLinks serviceName="audit" />
        </AsidePadding>
      </Aside>
    </Page>
  );
};
