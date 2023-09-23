import React, { useEffect, useState } from 'react';
import { FileTypeModal } from './fileTypeModal';
import { GoAButton } from '@abgov/react-components-new';
import { Role } from '@store/tenant/models';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { FetchFileTypeService } from '@store/file/actions';
import { createSelector } from 'reselect';
import { useHistory } from 'react-router-dom';
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
  const dispatch = useDispatch();
  const history = useHistory();

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
        testId="add-file-type-btn"
        onClick={() => {
          setWillAddNew(true);
          history.push({
            pathname: '/admin/services/file',
            search: '?fileTypes=true',
          });
        }}
      >
        Add file type
      </GoAButton>

      <FileTypeModal
        isOpen={willAddNew}
        type="new"
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
