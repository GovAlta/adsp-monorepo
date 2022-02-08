import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { FetchFileTypeService } from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { RootState } from '@store/index';
import { FileTypeTable } from './fileTypesTable';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { AddFileType } from './fileTypeNew';
import styled from 'styled-components';

export const FileTypes: FunctionComponent = () => {
  const dispatch = useDispatch();
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const NoContentContainer = styled.div`
    margin-bottom: 2em;
  `;

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileTypeService());
  }, []);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  return (
    <div>
      <div>
        {!indicator.show && fileTypes !== null && <AddFileType roles={realmRoles} />}
        {!indicator.show && fileTypes && fileTypes.length === 0 && (
          <NoContentContainer>{renderNoItem('file type')}</NoContentContainer>
        )}
        {indicator.show && <PageIndicator />}
        {!indicator.show && fileTypes && (
          <FileTypeTable roles={realmRoles} fileTypes={fileTypes} data-testid="file-type-table" />
        )}
      </div>
    </div>
  );
};
