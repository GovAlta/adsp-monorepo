import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { FetchFileTypeService } from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';

import { RootState } from '@store/index';
import { FileTypeTable } from './fileTypesTable';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';

export const FileTypes: FunctionComponent = () => {
  const dispatch = useDispatch();
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileTypeService());
  }, []);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  return (
    <div>
      <div>
        {!indicator.show && fileTypes.length === 0 && renderNoItem('filetype')}
        {!indicator.show && fileTypes && (
          <FileTypeTable roles={realmRoles} fileTypes={fileTypes} data-testid="file-type-table" />
        )}
        <PageIndicator />
      </div>
    </div>
  );
};
