import React, { useEffect, useState } from 'react';
import { FileTypeModal } from './fileTypeModal';
import { GoabButton } from '@abgov/react-components';
import { Role } from '@store/tenant/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

import { createSelector } from 'reselect';
import { useNavigate } from 'react-router-dom';
import { FileTypeDefault } from '@store/file/models';
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

  const navigate = useNavigate();

  useEffect(() => {
    if (activeEdit) {
      setWillAddNew(true);
    }
  }, [activeEdit]);

  return (
    <div>
      <GoabButton
        testId="add-file-type-btn"
        onClick={() => {
          setWillAddNew(true);
          navigate('/admin/services/file?fileTypes=true');
        }}
      >
        Add file type
      </GoabButton>

      <FileTypeModal
        isOpen={willAddNew}
        roles={roles}
        fileTypeNames={fileTypeNames}
        initialValue={FileTypeDefault}
        onCancel={() => {
          setWillAddNew(false);
        }}
      />
    </div>
  );
};
