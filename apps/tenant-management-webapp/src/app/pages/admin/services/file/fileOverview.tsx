import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { FetchRealmRoles } from '@store/tenant/actions';
import { GoAButton } from '@abgov/react-components-new';
import { FileMetrics } from './metrics';
import { FetchFileMetrics } from '@store/file/actions';
import { OverviewLayout } from '@components/Overview';

interface FileOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

const FileOverview = ({ setActiveEdit, setActiveIndex }: FileOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  const { url } = useRouteMatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileMetrics());
  }, []);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);

  return (
    <OverviewLayout
      description={
        <section>
          <p>
            The file service provides the capability to upload and download files. Consumers are registered with their
            own space (tenant) containing file types that include role based access policy, and can associate files to
            domain records.
          </p>
          <h2>File types</h2>
          <div>
            File types describe categories of files and include configuration of roles permitted to access and updated
            files.
          </div>
          <br />
        </section>
      }
      addButton={
        <GoAButton
          testId="add-file-type-btn"
          onClick={() => {
            history.push(`${url}/new`);
            setActiveEdit(true);
          }}
        >
          Add file type
        </GoAButton>
      }
      extra={<FileMetrics />}
    />
  );
};
export default FileOverview;
