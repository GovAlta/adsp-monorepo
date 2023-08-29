import React from 'react';

import { FileTypeItem } from '@store/file/models';
import { GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { DeleteFileTypeService } from '@store/file/actions';
import { DeleteModal } from '@components/DeleteModal';

interface FileTypeDeleteModalProps {
  isOpen: boolean;
  onCancel: () => void;
  fileType: FileTypeItem;
}

interface OkButtonProps {
  onCancel: () => void;
}

const OkButton = ({ onCancel }: OkButtonProps) => {
  return (
    <GoAButton
      type="secondary"
      testId="file-type-delete-modal-cancel-btn"
      onClick={() => {
        onCancel();
      }}
    >
      Okay
    </GoAButton>
  );
};

export const FileTypeDeleteModal = ({ onCancel, fileType }: FileTypeDeleteModalProps): JSX.Element => {
  const dispatch = useDispatch();
  if (fileType?.hasFile === true) {
    return (
      <GoAModal
        testId="file-type-delete-modal"
        open={true}
        heading="File type current in use"
        actions={
          <GoAButtonGroup alignment="end">
            <OkButton onCancel={onCancel} />
          </GoAButtonGroup>
        }
      >
        <p>
          You are unable to delete the file type <b>{`${fileType.name}`}</b> because there are files within the file
          type
        </p>
      </GoAModal>
    );
  }

  if (fileType?.hasFile === false) {
    return (
      <DeleteModal
        title="Delete file type"
        isOpen={true}
        onCancel={onCancel}
        content={
          <>
            <p>
              Delete the file type <b>{`${fileType.name}`}</b> cannot be undone.
            </p>
            <p>
              <b>Are you sure you want to continue?</b>
            </p>
          </>
        }
        onDelete={() => {
          dispatch(DeleteFileTypeService(fileType));
          onCancel();
        }}
      />
    );
  }
  return <div />;
};
