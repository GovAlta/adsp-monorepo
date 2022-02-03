import React, { useState, useEffect, useRef } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { Role } from '@store/tenant/models';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';

interface FileTypeModalProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editId: string;
  editable?: boolean;
  roles?: Role[];
  title: string;
  cancelFunc: () => void;
}

export const FileTypeModal = (props: FileTypeModalProps): JSX.Element => {
  const [fileType, setFileType] = useState({
    name: props.name,
    readRoles: props.readRoles,
    updateRoles: props.updateRoles,
    anonymousRead: props.anonymousRead,
    id: props.id,
  });
  return (
    <GoAModal testId="delete-confirmation" isOpen={true}>
      <GoAModalTitle>{props.title}</GoAModalTitle>
      <GoAModalContent>
        <GoAFormItem>
          <label>Application name</label>
          <GoAInput
            type="text"
            name="name"
            value={fileType.name}
            onChange={(name, value) => {
              setFileType({
                ...fileType,
                name: value,
              });
            }}
            aria-label="name"
          />
        </GoAFormItem>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="tertiary"
          data-testid="file-type-modal-cancel"
          onClick={() => {
            props.cancelFunc();
          }}
        >
          Cancel
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
