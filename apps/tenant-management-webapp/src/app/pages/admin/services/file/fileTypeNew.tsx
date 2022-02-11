import React, { useState } from 'react';
import { FileTypeModal } from './fileTypeModal';
import { GoAButton } from '@abgov/react-components';
import { Role } from '@store/tenant/models';

interface AddFileTypeProps {
  roles: Role[];
  onSwitch?: () => void;
}

export const AddFileType = ({ roles, onSwitch }: AddFileTypeProps): JSX.Element => {
  const [willAddNew, setWillAddNew] = useState<boolean>(false);

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
          onCancel={() => {
            setWillAddNew(false);
          }}
          onSwitch={onSwitch}
        />
      )}
    </div>
  );
};
