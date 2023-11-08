import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { GoAButton } from '@abgov/react-components-new';
import { FileMetrics } from './metrics';
import { FetchFileMetrics } from '@store/file/actions';
import { OverviewLayout } from '@components/Overview';
import { useHistory } from 'react-router-dom';

interface FileOverviewProps {
  setActiveEdit: (boolean) => void;
  setOpenAddFileType: (boolean) => void;
}

const FileOverview = ({ setOpenAddFileType, setActiveEdit }: FileOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(FetchFileMetrics());
  }, []);

  useEffect(() => {
    setActiveEdit(false);
  }, []);

  useEffect(() => {
    setOpenAddFileType(false);
    history.push({
      pathname: '/admin/services/file',
    });
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
            setOpenAddFileType(true);
            setActiveEdit(true);
            history.push({
              pathname: '/admin/services/file',
              search: '?fileTypes=true',
            });
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
