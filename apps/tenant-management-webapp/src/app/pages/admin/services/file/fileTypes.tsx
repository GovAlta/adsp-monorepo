import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import './file.css';
import { FetchFileTypeService } from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { RootState } from '@store/index';
import { FileTypeTable } from './fileTypesTable';
import { Notifications } from '@components/Notifications';

export default function FileTypes() {
  const dispatch = useDispatch();
  const fileSpace = useSelector((state: RootState) => state.fileService.space);
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const notifications = useSelector((state: RootState) => state.notifications.notifications);

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileTypeService());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTypes, notifications]);

  const NoSpace = () => {
    return <div>There is no space</div>;
  };

  return (
    <div>
      <Notifications notifications={notifications} tag="FileType" />
      <div>
        {fileSpace ? (
          <FileTypeTable roles={realmRoles} fileTypes={fileTypes} data-testid="file-type-table" />
        ) : (
          <NoSpace />
        )}
      </div>
    </div>
  );
}
