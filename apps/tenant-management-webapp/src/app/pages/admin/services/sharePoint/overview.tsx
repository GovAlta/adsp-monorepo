import React, { FunctionComponent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GoabButton } from '@abgov/react-components';
import { OverviewLayout } from '@components/Overview';
import { updateSharepointConnection } from '@store/sharePoint/actions';
import { ConnectionModal } from './connections/connectionModal';

export const SharePointOverview: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [openAddConnection, setOpenAddConnection] = useState(false);

  return (
    <>
      <OverviewLayout
        testId="sharepoint-service-overall"
        description={
          <div>
            <section>
              <p>
                The SharePoint service pushes data, such as form submissions, to a SharePoint list that your team owns.
                Add a connection with the details of your app registration, then a destination that maps data to list
                columns. ADSP never reads data back from SharePoint.
              </p>
            </section>
          </div>
        }
        addButton={
          <GoabButton
            size="compact"
            testId="add-connection-btn"
            onClick={() => {
              setOpenAddConnection(true);
            }}
          >
            Add connection
          </GoabButton>
        }
      />
      {openAddConnection && (
        <ConnectionModal
          open={openAddConnection}
          connectionId={undefined}
          onCancel={() => setOpenAddConnection(false)}
          onSave={(connection, clientSecret) => dispatch(updateSharepointConnection(connection, clientSecret))}
        />
      )}
    </>
  );
};
