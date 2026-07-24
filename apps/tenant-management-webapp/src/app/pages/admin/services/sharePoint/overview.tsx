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
                The SharePoint service allows developers to connect to a SharePoint List, so that they can read, create,
                and update its data.
              </p>
            </section>
          </div>
        }
        addButton={
          <GoabButton size="compact"
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
          onSave={(connection) => dispatch(updateSharepointConnection(connection))}
        />
      )}
    </>
  );
};
