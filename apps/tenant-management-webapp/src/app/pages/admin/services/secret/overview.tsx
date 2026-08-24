import React, { FunctionComponent } from 'react';
import { OverviewLayout } from '@components/Overview';

export const SecretOverview: FunctionComponent = () => {
  return (
    <OverviewLayout
      testId="secret-service-overall"
      description={
        <div>
          <section>
            <p>
              The secret service allows applications to save sensitive data in a highly secure storage facility. Once a
              secret has been saved, it will not be accessible to anyone outside of the secret service itself.
              Applications can use the data indirectly through a callback function that has been registered through the
              service.
            </p>
          </section>
        </div>
      }
    />
  );
};
