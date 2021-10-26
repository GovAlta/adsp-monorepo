import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { FetchFileTypeService } from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { RootState } from '@store/index';
import { FileTypeTable } from './fileTypesTable';
import { GoAPageLoader } from '@abgov/react-components';

export const FileTypes: FunctionComponent = () => {
  const dispatch = useDispatch();
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
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
  }, [fileTypes]);

  return (
    <div>
      {showLoadingIndicator && <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />}
      <div>
        {!showLoadingIndicator && (
          <FileTypeTable roles={realmRoles} fileTypes={fileTypes} data-testid="file-type-table" />
        )}
      </div>
    </div>
  );
};
