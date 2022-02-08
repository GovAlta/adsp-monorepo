import React from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { FileTypeItem } from '@store/file/models';
import { GoAButton } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { DeleteFileTypeService } from '@store/file/actions';

interface FileTypeDeleteModalProps {
  onCancel: () => void;
  fileType: FileTypeItem;
}

interface OkButtonProps {
  onCancel: () => void;
}

const OkButton = ({ onCancel }: OkButtonProps) => {
  return (
    <GoAButton
      buttonType="secondary"
      data-testid="file-type-delete-modal-cancel-btn"
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
  if (fileType.hasFile === true) {
    return (
      <GoAModal testId="file-type-delete-modal" isOpen={true}>
        <GoAModalTitle testId="file-type-delete-modal-title">File type current in use</GoAModalTitle>
        <GoAModalContent testId="file-type-delete-modal-content">
          <p>
            You are unable to delete the file type <b>{`${fileType.name}`}</b> because there are files within the file
            type
          </p>
        </GoAModalContent>
        <GoAModalActions>
          <OkButton onCancel={onCancel} />
        </GoAModalActions>
      </GoAModal>
    );
  }

  if (fileType.hasFile === false) {
    return (
      <GoAModal testId="file-type-delete-modal" isOpen={true}>
        <GoAModalTitle testId="file-type-delete-modal-title">Deleting file type</GoAModalTitle>
        <GoAModalContent testId="file-type-delete-modal-content">
          <p>
            Deleting the file type <b>{`${fileType.name}`}</b> cannot be undone.
          </p>
          <p>
            <b>Are you sure you want to continue?</b>
          </p>{' '}
          <GoAModalActions>
            <GoAButton
              buttonType="secondary"
              data-testid="file-type-delete-modal-delete-cancel"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              data-testid="file-type-delete-modal-delete-btn"
              onClick={() => {
                dispatch(DeleteFileTypeService(fileType));
                onCancel();
              }}
            >
              Delete
            </GoAButton>
          </GoAModalActions>
        </GoAModalContent>
      </GoAModal>
    );
  }
};
