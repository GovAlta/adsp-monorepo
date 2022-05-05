import React, { useEffect, useState } from 'react';
import { FileTypeModal } from './fileTypeModal';
import { GoAButton } from '@abgov/react-components';
import { Role } from '@store/tenant/models';

interface AddFileTypeProps {
  roles: Role[];
  activeEdit: boolean;
}

export const AddFileType = ({ roles, activeEdit }: AddFileTypeProps): JSX.Element => {
  const [willAddNew, setWillAddNew] = useState<boolean>(false);

  useEffect(() => {
    if (activeEdit) {
      setWillAddNew(true);
    }
  }, [activeEdit]);

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
