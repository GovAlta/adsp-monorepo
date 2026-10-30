import { GoabCallout, GoabContainer } from '@abgov/react-components';
import React, { useEffect, useState } from 'react';
import { ServiceContainer } from '../../styled-components';
import { ensureActionCatalog } from './auditApi';
import { errorMessage } from './util';

interface AuditPageProps {
  heading: string;
  testId: string;
  children: React.ReactNode;
}

// Wraps each audit example and makes sure the sandbox's action catalog is registered before events are written.
export const AuditPage = ({ heading, testId, children }: AuditPageProps) => {
  const [init, setInit] = useState<{ type: 'success' | 'important'; message: string }>();

  useEffect(() => {
    ensureActionCatalog()
      .then((created) => {
        if (created) {
          setInit({ type: 'success', message: 'Registered the sandbox action catalog (sample-action).' });
        }
      })
      .catch((err) =>
        setInit({
          type: 'important',
          message: `Could not verify or register the action catalog: ${errorMessage(err)}`,
        })
      );
  }, []);

  return (
    <ServiceContainer>
      <GoabContainer accent="thick" type="non-interactive" width={'full'} testId={testId} heading={heading}>
        {init && (
          <GoabCallout type={init.type} heading="Initialization" mb="l">
            {init.message}
          </GoabCallout>
        )}
        {children}
      </GoabContainer>
    </ServiceContainer>
  );
};
