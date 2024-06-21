import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { FetchFileTypeService } from '@store/file/actions';

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

interface AddFileTypeProps {
  activeEdit: boolean;
  openAddFileType: boolean;
}

export const FileTypes = ({ activeEdit }: AddFileTypeProps): JSX.Element => {
  const roles = useSelector((state: RootState) => state.tenant.realmRoles);

  return <FileTypesTableContainer roles={roles} activeEdit={activeEdit} />;
};

interface FileTypesTableContainerProps {
  roles: Role[];
  activeEdit: boolean;
}

const FileTypesTableContainer = ({ roles, activeEdit }: FileTypesTableContainerProps): JSX.Element => {
  const dispatch = useDispatch();
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const coreFileTypes = useSelector((state: RootState) => state.fileService.coreFileTypes);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    if (!fileTypes) {
      dispatch(FetchFileTypeService());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  return (
    <>
      {!indicator.show && fileTypes && fileTypes.length === 0 && (
        <NoContentContainer>{renderNoItem('file type')}</NoContentContainer>
      )}
      {indicator.show && <PageIndicator />}
      {!indicator.show && fileTypes && (
        <div>
          <AddFileType roles={roles} activeEdit={activeEdit} />
          <FileTypeTable
            roles={roles}
            fileTypes={fileTypes}
            coreFileTypes={coreFileTypes}
            data-testid="file-type-table"
          />
        </div>
      )}
    </>
  );
};
