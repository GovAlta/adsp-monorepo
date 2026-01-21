import React, { useState } from 'react';
import DataTable from '@components/DataTable';
import { Role } from '@store/tenant/models';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import styled from 'styled-components';
import { GoabButtonGroup, GoabModal, GoabButton } from '@abgov/react-components';
import { FileTypeItem } from '@store/file/models';
import { useNavigate } from 'react-router-dom';
import { DeleteModal } from '@components/DeleteModal';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteFileTypeService, checkFileTypeHasFile } from '@store/file/actions';
import { RootState } from '@store/index';
import { Gap, RolesContainer, RolesWrap } from '../styled-components';

interface FileTypeRowProps extends FileTypeItem {
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
  securityClassification,
  rules,
  onEdit,
  onDelete,
}: FileTypeRowProps): JSX.Element => {
  const dispatch = useDispatch();
  return (
    <tr key={id}>
      <td>{name}</td>
      <td style={{ textTransform: 'capitalize' }}>{securityClassification ? securityClassification : ''}</td>
      <td>{rules?.retention?.active ? rules?.retention?.deleteInDays : 'N/A'}</td>
      <td className="actionCol">
        <GoAContextMenu>
          <GoAContextMenuIcon
            type="create"
            title="Edit"
            testId={`file-type-row-edit-btn-${id}`}
            onClick={() => {
              onEdit?.();
            }}
          />
          <GoAContextMenuIcon
            testId={`file-type-row-delete-btn-${id}`}
            title="Delete"
            type="trash"
            onClick={() => {
              dispatch(checkFileTypeHasFile(id));
              onDelete?.();
            }}
          />
        </GoAContextMenu>
      </td>
    </tr>
  );
};

export const CoreFileTypeTableRow = ({
  id,
  name,
  readRoles,
  updateRoles,
  securityClassification,
  rules,
  onEdit,
  onDelete,
}: FileTypeRowProps): JSX.Element => {
  const [showCoreRoles, setShowCoreRoles] = useState<boolean>(false);

  return (
    <>
      <tr key={id}>
        <td>{name}</td>
        <td style={{ textTransform: 'capitalize' }}>{securityClassification ? securityClassification : ''}</td>
        <td>{rules?.retention?.active ? rules?.retention?.deleteInDays : 'N/A'}</td>
        <td className="actionCol">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showCoreRoles ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => {
                setShowCoreRoles(!showCoreRoles);
              }}
              testId="configuration-toggle-details-visibility"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showCoreRoles && (
        <tr>
          <td
            colSpan={4}
            style={{
              padding: '0',
            }}
          >
            <RolesContainer>
              <RolesWrap>
                Read :{' '}
                {readRoles.map((role): JSX.Element => {
                  return <span>{role} </span>;
                })}
              </RolesWrap>
              <Gap></Gap>
              <RolesWrap>
                Modify :{' '}
                {updateRoles?.map((role): JSX.Element => {
                  return <span>{role} </span>;
                })}
              </RolesWrap>
            </RolesContainer>
          </td>
        </tr>
      )}
    </>
  );
};

export const FileTypeTable = ({ roles, fileTypes, coreFileTypes }: FileTypeTableProps): JSX.Element => {
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteFileType = fileTypes.find((x) => x && x.id === deleteId);
  const hasFile = useSelector((state: RootState) => state.fileService.hasFile[deleteId]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <div>
      {fileTypes && fileTypes.length > 0 && (
        <TableLayout>
          <DataTable data-testid="file-types-table">
            <thead data-testid="file-types-table-header" id="file-types-table-header">
              <tr>
                <th id="name" data-testid="file-types-table-header-name">
                  Name
                </th>
                <th id="security-classification">
                  Security
                  <br /> classification
                </th>
                <th id="retention-policy">Retention period</th>
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
                      navigate(`edit/${fileType?.id}`);
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
        <>
          <h3>Core file types</h3>

          <TableLayout>
            <DataTable data-testid="file-types-table">
              <thead data-testid="file-types-table-header" id="file-types-table-core-header">
                <tr>
                  <th id="name-core" data-testid="file-types-table-header-name">
                    Name
                  </th>
                  <th id="security-classification-core">
                    Security <br /> classification
                  </th>
                  <th id="retention-policy-core">Retention period</th>
                  <th id="Actions">Actions</th>
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
        </>
      )}
      <DeleteModal
        title="Delete file type"
        isOpen={deleteId && hasFile === false}
        content={
          <div>
            Are you sure you wish to delete <b> {deleteFileType?.name}</b>?
          </div>
        }
        onCancel={() => {
          setDeleteId(null);
        }}
        onDelete={() => {
          dispatch(DeleteFileTypeService(deleteFileType));
          setDeleteId(null);
        }}
      />
      <GoabModal
        testId="file-type-delete-modal"
        open={!!deleteId && hasFile === true}
        heading="File type current in use"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              testId="file-type-delete-modal-cancel-btn"
              onClick={() => {
                setDeleteId(null);
              }}
            >
              Okay
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <p>
          You are unable to delete the file type <b>{`${deleteFileType?.name}`}</b> because there are files within the
          file type
        </p>
      </GoabModal>
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
