import React, { FunctionComponent } from 'react';
import { OverviewLayout } from '@components/Overview';

export const SharePointOverview: FunctionComponent = () => {
  return (
    <OverviewLayout
      testId="sharepoint-service-overall"
      description={
        <div>
          <section>
            <p>
              The SharePoint service allows developers to connect to a SharePoint List, so that they can read, create,
              and update its data.
            </p>
          </section>
        </div>
      }
    />
  );
};
