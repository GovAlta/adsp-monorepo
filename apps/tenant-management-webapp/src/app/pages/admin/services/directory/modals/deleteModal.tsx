import React, { useEffect } from 'react';
import { DeleteModal } from '@components/DeleteModal';
import { DeleteModalType } from '@store/directory/models';
import { selectDirectoryDeleteDirectory } from '@store/directory/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { deleteEntry } from '@store/directory/actions';
import { ResetModalState } from '@store/session/actions';
import { selectModalStateByType } from '@store/session/selectors';

export const DirectoryDeleteModal = (): JSX.Element => {
  const title = 'Delete entry';
  const dispatch = useDispatch();

  const directory = useSelector(selectDirectoryDeleteDirectory);
  const modal = useSelector(selectModalStateByType(DeleteModalType));
  const content =
    directory && `Delete ${directory?.api ? `${directory?.service}:${directory?.api}` : directory.service}?`;

  // eslint-disable-next-line
  useEffect(() => {}, [modal?.isOpen]);

  return (
    <DeleteModal
      title={title}
      isOpen={directory !== undefined && modal.isOpen === true}
      content={content}
      onCancel={() => {
        dispatch(ResetModalState());
      }}
      onDelete={() => {
        dispatch(deleteEntry(directory));
        dispatch(ResetModalState());
      }}
    />
  );
};
