import React from 'react';
import { GoabTab, GoabTabs, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { AuditPage } from './audit/AuditPage';
import { AuditEvents } from './audit/AuditEvents';
import { AuditActions } from './audit/AuditActions';
import { AuditWrite } from './audit/AuditWrite';
import { AuditFailedEvents } from './audit/AuditFailedEvents';

export const AuditServiceMain = (_props: ServiceMainProps) => {
  return (
    <AuditPage heading="Audit service" testId="auditServiceContainer">
      <GoabText size="body-m" mb="l">
        Samples for the Audit service. Events are written under the sandbox-app namespace, whose action catalog
        is registered automatically.
      </GoabText>
      <GoabTabs initialTab={1}>
        <GoabTab heading="Events">
          <AuditEvents />
        </GoabTab>
        <GoabTab heading="Action catalog">
          <AuditActions />
        </GoabTab>
        <GoabTab heading="Write event">
          <AuditWrite />
        </GoabTab>
        <GoabTab heading="Failed events">
          <AuditFailedEvents />
        </GoabTab>
      </GoabTabs>
    </AuditPage>
  );
};
