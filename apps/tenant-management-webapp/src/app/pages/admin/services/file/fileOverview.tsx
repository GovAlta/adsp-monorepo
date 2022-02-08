import React, { useEffect } from 'react';
import { AddFileType } from './fileTypeNew';
import { useDispatch, useSelector } from 'react-redux';
import { FetchRealmRoles } from '@store/tenant/actions';
import { RootState } from '@store/index';

interface FileOverviewProps {
  onSwitch: () => void;
}

const FileOverview = ({ onSwitch }: FileOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);

  return (
    <div>
      <div>
        The file service provides the capability to upload and download files. Consumers are registered with their own
        space (tenant) containing file types that include role based access policy, and can associate files to domain
        records.
      </div>
      <h2>File types</h2>
      <div>
        File types describe categories of files and include configuration of roles permitted to access and updated
        files.
      </div>
      <br />
      <div>{realmRoles && <AddFileType roles={realmRoles} onSwitch={onSwitch} />}</div>
    </div>
  );
};
export default FileOverview;
