import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FetchRealmRoles } from '@store/tenant/actions';
import { GoAButton } from '@abgov/react-components';
import { FileMetrics } from './metrics';
import { FetchFileMetrics } from '@store/file/actions';

interface FileOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

const FileOverview = ({ setActiveEdit, setActiveIndex }: FileOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileMetrics());
  }, []);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);

  return (
    <div>
      <section>
        <p>
          The file service provides the capability to upload and download files. Consumers are registered with their own
          space (tenant) containing file types that include role based access policy, and can associate files to domain
          records.
        </p>
        <h2>File types</h2>
        <div>
          File types describe categories of files and include configuration of roles permitted to access and updated
          files.
        </div>
        <br />
        <GoAButton
          data-testid="add-file-type-btn"
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add file type
        </GoAButton>
      </section>
      <FileMetrics />
    </div>
  );
};
export default FileOverview;
