import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import './file.css';
import { FetchFileTypeService } from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { RootState } from '@store/index';
import { FileTypeTable } from './fileTypesTable';
import { Notifications } from '@components/Notifications';
import { GoAPageLoader } from '@abgov/react-components';

export default function FileTypes() {
  const dispatch = useDispatch();
  const fileSpace = useSelector((state: RootState) => state.fileService.space);
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState<boolean>(false);

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileTypeService());
  }, []);

  useEffect(() => {
    setShowLoadingIndicator(true);
    setTimeout(() => {
      setShowLoadingIndicator(false);
    }, 500);
  }, [fileTypes, notifications]);

  const NoSpace = () => {
    return <div>There is no space</div>;
  };

  return (
    <div>
      <Notifications notifications={notifications} tag="FileType" />
      {showLoadingIndicator && <GoAPageLoader visible={true} message="Loading..." type="infinite" />}
      <div>
        {fileSpace ? (
          !showLoadingIndicator && (
            <FileTypeTable roles={realmRoles} fileTypes={fileTypes} data-testid="file-type-table" />
          )
        ) : (
          <NoSpace />
        )}
      </div>
    </div>
  );
}
