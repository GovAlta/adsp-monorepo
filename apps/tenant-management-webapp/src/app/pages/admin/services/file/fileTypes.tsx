import { useEffect } from 'react';
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
import { Role } from '@store/tenant/models';

const NoContentContainer = styled.div`
  margin-bottom: 2em;
`;

export const FileTypes = (): JSX.Element => {
  const dispatch = useDispatch();
  const roles = useSelector((state: RootState) => state.tenant.realmRoles);

  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  return (
    <div>
      {roles && <AddFileType roles={roles} />}
      <FileTypesTableContainer roles={roles} />
    </div>
  );
};

interface FileTypesTableContainerProps {
  roles: Role[];
}

const FileTypesTableContainer = ({ roles }: FileTypesTableContainerProps): JSX.Element => {
  const dispatch = useDispatch();
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    dispatch(FetchFileTypeService());
  }, []);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  return (
    <div>
      <div>
        {!indicator.show && fileTypes && fileTypes.length === 0 && (
          <NoContentContainer>{renderNoItem('file type')}</NoContentContainer>
        )}
        {indicator.show && <PageIndicator />}
        {!indicator.show && fileTypes && (
          <FileTypeTable roles={roles} fileTypes={fileTypes} data-testid="file-type-table" />
        )}
      </div>
    </div>
  );
};
