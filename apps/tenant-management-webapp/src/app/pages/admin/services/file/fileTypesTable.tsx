import React, { useState } from 'react';
import DataTable from '@components/DataTable';
import { Role } from '@store/tenant/models';
import { FileTypeModal } from './fileTypeModal';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { AddFileType } from './fileTypeNew';
import { FileTypeDeleteModal } from './fileTypeDeleteModal';

interface FileTypeRowProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editId: string;
  editable?: boolean;
  roles?: Role[];
  onEdit?: () => void;
  onDelete?: () => void;
}

interface FileTypeTableProps {
  roles;
  fileTypes;
}

const FileTypeTableRow = ({
  id,
  name,
  readRoles,
  updateRoles,
  anonymousRead,
  editId,
  onEdit,
  onDelete,
}: FileTypeRowProps): JSX.Element => {
  return (
    <tr key={id}>
      <td>{name}</td>
      <td>{readRoles}</td>
      <td>{updateRoles}</td>
      <td>{anonymousRead}</td>
      <td>
        <GoAContextMenu>
          <GoAContextMenuIcon
            type={id === editId ? 'eye' : 'eye-off'}
            title="Edit"
            onClick={() => {
              onEdit();
            }}
            testId="file-type-edit-action-icon-btn"
          />
          <GoAIconButton
            testId="file-type-delete-action-icon-btn"
            title="Delete"
            size="medium"
            type="trash"
            onClick={() => {
              onDelete();
            }}
          />
        </GoAContextMenu>
      </td>
    </tr>
  );
};

export const FileTypeTable = ({ roles, fileTypes }: FileTypeTableProps): JSX.Element => {
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const editFileType = fileTypes.find((x) => x.id === editId);
  const deleteFileType = fileTypes.find((x) => x.id === deleteId);

  const editModalProps = {
    fileType: editFileType,
    onCancel: () => {
      setEditId(null);
    },
  };

  const deleteModalProps = {
    fileType: deleteFileType,
    onCancel: () => {
      setDeleteId(null);
    },
  };

  return (
    <div>
      <AddFileType roles={roles} />
      <DataTable data-testid="file-types-table">
        <thead data-testid="file-types-table-header">
          <tr>
            <th id="name" data-testid="events-definitions-table-header-name">
              Name
            </th>
            <th id="read-roles">Who can read</th>
            <th id="write-roles">Who can edit</th>
            <th id="anonymous">Anonymous</th>
            <th id="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fileTypes.map((fileType) => {
            const rowProps = {
              ...fileType,
              editId,
            };
            return (
              <FileTypeTableRow
                key={fileType.id}
                {...rowProps}
                onEdit={() => {
                  setEditId(fileType.id);
                }}
                onDelete={() => {
                  setDeleteId(fileType.id);
                }}
              />
            );
          })}
        </tbody>
      </DataTable>
      {editId && <FileTypeModal {...{ ...editModalProps, roles, type: 'edit' }} />}
      {deleteId && <FileTypeDeleteModal {...deleteModalProps} />}
    </div>
  );
};
