import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { GoabButton } from '@abgov/react-components';
import { FileMetrics } from './metrics';
import { FetchFileMetrics } from '@store/file/actions';
import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';
import { NoPaddingH2 } from '@components/AppHeader';

interface FileOverviewProps {
  setActiveEdit: (boolean) => void;
  setOpenAddFileType: (boolean) => void;
}

const FileOverview = ({ setOpenAddFileType, setActiveEdit }: FileOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(FetchFileMetrics());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveEdit(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOpenAddFileType(false);
    navigate('/admin/services/file');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section>
      <OverviewLayout
        description={
          <>
            <p>
              The file service provides the capability to upload and download files. Consumers are registered with their
              own space (tenant) containing file types that include role based access policy, and can associate files to
              domain records.
            </p>
            <NoPaddingH2>File types</NoPaddingH2>
            <div>
              File types describe categories of files and include configuration of roles permitted to access and updated
              files.
            </div>
            <br />
          </>
        }
        addButton={
          <GoabButton
            testId="add-file-type-btn"
            onClick={() => {
              setOpenAddFileType(true);
              setActiveEdit(true);
              navigate('/admin/services/file?fileTypes=true');
            }}
          >
            Add file type
          </GoabButton>
        }
        extra={<FileMetrics />}
      />
    </section>
  );
};
export default FileOverview;
