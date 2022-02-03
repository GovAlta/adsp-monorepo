import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { GoADropdownOption, GoAButton, GoADropdown } from '@abgov/react-components';
import { GoABadge } from '@abgov/react-components/experimental';
import { FileTypeItem } from '@store/file/models';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Role } from '@store/tenant/models';
import {
  DeleteFileTypeService,
  CreateFileTypeService,
  UpdateFileTypeService,
  FetchFileTypeHasFileService,
} from '@store/file/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { FileTypeModal } from './fileTypeModal';

interface FileTypeRowProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editId: string;
  editable?: boolean;
  roles?: Role[];
  editFunc?: () => void;
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
  editFunc,
}: FileTypeRowProps): JSX.Element => {
  return (
    <tr key={id}>
      <td>{name}</td>
      <td>{readRoles}</td>
      <td>{updateRoles}</td>
      <td>{anonymousRead}</td>
      <td>
        <GoAContextMenuIcon
          type={id === editId ? 'eye' : 'eye-off'}
          onClick={() => {
            editFunc();
          }}
          data-testid="file-types-edit-action"
        />
      </td>
    </tr>
  );
};

export const FileTypeTable = ({ roles, fileTypes }: FileTypeTableProps): JSX.Element => {
  const [editId, setEditId] = useState<string | null>(null);
  const editFileType = fileTypes.find((x) => x.id === editId);
  const editModalProps = {
    ...editFileType,
    title: 'Edit file type',
    cancelFunc: () => {
      setEditId(null);
    },
  };

  return (
    <div>
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
                editFunc={() => {
                  setEditId(fileType.id);
                }}
              />
            );
          })}
        </tbody>
      </DataTable>
      {editId && <FileTypeModal {...editModalProps} />}
    </div>
  );
};
