import React, { useState } from 'react';
import DataTable from '@components/DataTable';
import { Role } from '@store/tenant/models';
import { FileTypeModal } from './fileTypeModal';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { FileTypeDeleteModal } from './fileTypeDeleteModal';
import styled from 'styled-components';
import { GoABadge } from '@abgov/react-components/experimental';

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
  coreFileTypes;
}

const FileTypeTableRow = ({
  id,
  name,
  readRoles,
  updateRoles,
  anonymousRead,
  onEdit,
  onDelete,
}: FileTypeRowProps): JSX.Element => {
  return (
    <tr key={id}>
      <td>{name}</td>
      <td className="readRolesCol">
        {anonymousRead === false &&
          readRoles.map((role): JSX.Element => {
            return (
              <div key={`read-roles-${role}`}>
                <GoABadge key={`read-roles-${role}`} type="information" content={role} />
              </div>
            );
          })}
        {anonymousRead === true && 'public'}
      </td>
      <td className="updateRolesCol">
        {updateRoles.map((role): JSX.Element => {
          return <GoABadge key={`update-roles-${id}-${role}`} type="information" content={role} />;
        })}
      </td>
      <td className="actionCol">
        <GoAContextMenu>
          <GoAContextMenuIcon
            type="create"
            title="Edit"
            testId={`file-type-row-edit-btn-${id}`}
            onClick={() => {
              onEdit();
            }}
          />
          <GoAIconButton
            testId={`file-type-row-delete-btn-${id}`}
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

const CoreFileTypeTableRow = ({
  id,
  name,
  readRoles,
  updateRoles,
  anonymousRead,
  onEdit,
  onDelete,
}: FileTypeRowProps): JSX.Element => {
  return (
    <tr key={id}>
      <td>{name}</td>
      <td className="readRolesCol">
        {anonymousRead === false &&
          readRoles.map((role): JSX.Element => {
            return (
              <div key={`read-roles-${role}`}>
                <GoABadge key={`read-roles-${role}`} type="information" content={role} />
              </div>
            );
          })}
        {anonymousRead === true && 'public'}
      </td>
      <td className="updateRolesCol">
        {updateRoles?.map((role): JSX.Element => {
          return <GoABadge key={`update-roles-${id}-${role}`} type="information" content={role} />;
        })}
      </td>
    </tr>
  );
};

export const FileTypeTable = ({ roles, fileTypes, coreFileTypes }: FileTypeTableProps): JSX.Element => {
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const editFileType = fileTypes.find((x) => x && x.id === editId);
  const deleteFileType = fileTypes.find((x) => x && x.id === deleteId);

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
      {fileTypes && fileTypes.length > 0 && (
        <TableLayout>
          <DataTable data-testid="file-types-table">
            <thead data-testid="file-types-table-header">
              <tr>
                <th id="name" data-testid="events-definitions-table-header-name">
                  Name
                </th>
                <th id="read-roles">Read roles</th>
                <th id="write-roles">Modify roles</th>
                <th className="actionsCol" id="actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {fileTypes?.map((fileType) => {
                const rowProps = {
                  ...fileType,
                  editId,
                };
                return (
                  <FileTypeTableRow
                    key={`file-type-row-${fileType?.id}`}
                    {...rowProps}
                    onEdit={() => {
                      setEditId(fileType?.id);
                    }}
                    onDelete={() => {
                      setDeleteId(fileType?.id);
                    }}
                  />
                );
              })}
            </tbody>
          </DataTable>
        </TableLayout>
      )}
      {coreFileTypes && coreFileTypes.length > 0 && (
        <div>
          <h4>Core file types</h4>
          <TableLayout>
            <DataTable data-testid="file-types-table">
              <thead data-testid="file-types-table-header">
                <tr>
                  <th id="name" data-testid="events-definitions-table-header-name">
                    Name
                  </th>
                  <th id="read-roles">Read roles</th>
                  <th id="write-roles">Modify roles</th>
                </tr>
              </thead>
              <tbody>
                {coreFileTypes?.map((coreFileType) => {
                  const rowProps = {
                    ...coreFileType,
                    editId,
                  };
                  return (
                    <CoreFileTypeTableRow
                      key={`file-type-row-${coreFileType?.id}`}
                      {...rowProps}
                      onEdit={() => {
                        setEditId(coreFileType?.id);
                      }}
                      onDelete={() => {
                        setDeleteId(coreFileType?.id);
                      }}
                    />
                  );
                })}
              </tbody>
            </DataTable>
          </TableLayout>
        </div>
      )}
      {editId && <FileTypeModal {...{ ...editModalProps, roles, type: 'edit' }} />}
      {deleteId && <FileTypeDeleteModal {...deleteModalProps} />}
    </div>
  );
};

const TableLayout = styled.div`
  margin-top: 1em;
  table,
  th,
  td {
    .anonymousCol {
      width: 15%;
    }
    .actionsCol {
      width: 15%;
    }
    .readRolesCol {
      width: 35%;
    }
    .updateRolesCol {
      width: 35%;
    }
  }
`;
