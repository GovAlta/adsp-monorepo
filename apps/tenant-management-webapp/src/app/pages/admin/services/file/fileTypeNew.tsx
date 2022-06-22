import React, { useEffect, useState } from 'react';
import { FileTypeModal } from './fileTypeModal';
import { GoAButton } from '@abgov/react-components';
import { Role } from '@store/tenant/models';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { FetchFileTypeService } from '@store/file/actions';
import { createSelector } from 'reselect';

interface AddFileTypeProps {
  roles: Role[];
  activeEdit: boolean;
}

export const selectFileTyeNames = createSelector(
  (state: RootState) => state.fileService.fileTypes,
  (state: RootState) => state.fileService.coreFileTypes,
  (fileTypes, coreFileTypes) => {
    if (fileTypes && coreFileTypes) {
      return [
        ...fileTypes.map((type) => {
          return type.name;
        }),
        ...coreFileTypes.map((type) => {
          return type.name;
        }),
      ];
    } else {
      return null;
    }
  }
);

export const AddFileType = ({ roles, activeEdit }: AddFileTypeProps): JSX.Element => {
  const [willAddNew, setWillAddNew] = useState<boolean>(false);
  const fileTypeNames = useSelector(selectFileTyeNames);
  const dispatch = useDispatch();

  useEffect(() => {
    if (activeEdit) {
      setWillAddNew(true);
    }
  }, [activeEdit]);

  useEffect(() => {
    if (!fileTypeNames) {
      dispatch(FetchFileTypeService());
    }
  }, []);

  return (
    <div>
      <GoAButton
        data-testid="add-file-type-btn"
        onClick={() => {
          setWillAddNew(true);
        }}
      >
        Add file type
      </GoAButton>
      {willAddNew && (
        <FileTypeModal
          type="new"
          roles={roles}
          fileTypeNames={fileTypeNames}
          fileType={{
            name: '',
            updateRoles: [],
            readRoles: [],
            anonymousRead: false,
            hasFile: false,
            id: null,
          }}
          onCancel={() => {
            setWillAddNew(false);
          }}
        />
      )}
    </div>
  );
};
