import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { Gutter } from '@components/Gutter';
import { GoAButton, GoADropdown, GoAOption, GoACallout } from '@abgov/react-components';
import { FileTypeItem } from '@store/file/models';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuid4 } from 'uuid';
import { RootState } from '@store/index';
import { Role } from '@store/tenant/models';

import {
  DeleteFileTypeService,
  CreateFileTypeService,
  UpdateFileTypeService,
  FetchFileTypeHasFileService,
} from '@store/file/actions';
const TitleContainer = styled.div`
  h3 {
    display: inline;
    position: relative;
    top: 24px;
  }

  button {
    float: right;
  }
  margin-bottom: 12px;
`;

const FileTypeTableContainer = styled.div`
  table {
    margin-top: 20px;
  }

  td.right {
    text-align: right !important;
  }
  th.right {
    text-align: right !important;
  }
  input {
    padding-left: 0.5rem;
    padding-top: 0px !important;
    padding-bottom: 0px !important;
    border-radius: 4px;
    margin-top: 8px;
    height: 42px;
  }

  th {
    font-size: 18px !important;
    font-weight: normal !important;
  }

  i {
    margin-top: 2px !important;
  }
  td:nth-child(1) {
    width: 10%;
  }
  td:nth-child(2) {
    width: 15%;
  }
  td:nth-child(3) {
    width: 30%;
  }
  td:nth-child(4) {
    width: 30%;
  }
  td:nth-child(5) {
    width: 15%;
  }
`;

const DeleteModalContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 650px;
  transform: translate(-50%, -30%);
  z-index: 9;
  .right {
    text-align: right;
  }
`;

const RoleSpan = styled.span`
  background: #f1f1f1 padding-box;
  border-radius: 13px;
  margin-right: 10px;
`;

interface FileTypeRowProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editable?: boolean;
  roles?: Role[];
  hasFile?: boolean;
  callback?: (updatedFileType: FileTypeItem) => void;
  cellType?: 'readRoles' | 'updateRoles';
  rowType?: 'update' | 'new';
}

interface FileTypeTableProps {
  roles;
  fileTypes;
}

export const FileTypeTable = (props: FileTypeTableProps) => {
  const [editableId, setEditableId] = useState('');
  const [startCreateFileType, setStartCreateFileType] = useState(false);
  const [updateFileType, setUpdateFileType] = useState<FileTypeItem>(null);
  const [newFileType, setNewFileType] = useState<FileTypeItem>(null);
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const { roles, fileTypes } = props;
  if (roles === null || fileTypes === []) {
    return <div />;
  }

  const NameCell = (props: FileTypeRowProps) => {
    const [name, setName] = useState(props.name);
    return (
      <td date-testid="name">
        {props.editable ? (
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            onBlur={(e) => {
              updateFileType.name = e.target.value;
              setUpdateFileType({ ...updateFileType });
            }}
          />
        ) : (
          props.name
        )}
      </td>
    );
  };

  const ActionCell = (props: FileTypeRowProps) => {
    const { rowType, id } = props;
    const dispatch = useDispatch();

    const Create = () => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          key={`${props.id}-confirm-button`}
          onClick={() => {
            alert('a');
            dispatch(CreateFileTypeService({ ...newFileType, id }));
            setNewFileType(null);
          }}
          data-testid="confirm-new"
        >
          Confirm
        </GoAButton>
      );
    };

    const Update = () => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="confirm-update"
          onClick={() => {
            dispatch(UpdateFileTypeService({ ...updateFileType, id }));
            setUpdateFileType(null);
            setEditableId('');
          }}
        >
          Confirm
        </GoAButton>
      );
    };

    const Edit = () => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="edit-file-type"
          onClick={() => {
            if (editableId !== props.id) {
              setEditableId(props.id);
              // When we select a new line, we will lose unsaved information
              setShowDelete(false);
              setUpdateFileType({ ...props });
            }
          }}
        >
          Edit
        </GoAButton>
      );
    };

    return (
      <td>
        {rowType === 'update' && props.id === editableId && <Update />}
        {rowType === 'update' && props.id !== editableId && <Edit />}
        {props.rowType === 'new' && <Create />}
      </td>
    );
  };

  const CancelCell = (props: FileTypeRowProps) => {
    const { rowType } = props;
    const Delete = () => {
      return (
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="delete-file-type"
          onClick={() => {
            setUpdateFileType(props);
            setShowDelete(true);
          }}
        >
          Delete
        </GoAButton>
      );
    };
    const CancelNew = () => {
      return (
        <GoAButton
          buttonType="secondary"
          buttonSize="small"
          data-testid="cancel-new"
          onClick={() => {
            setStartCreateFileType(false);
            setNewFileType(null);
          }}
        >
          Cancel
        </GoAButton>
      );
    };

    const CancelUpdate = () => {
      return (
        <GoAButton
          buttonType="secondary"
          buttonSize="small"
          data-testid="cancel-update"
          onClick={() => {
            setEditableId('');
            setUpdateFileType(null);
          }}
        >
          Cancel
        </GoAButton>
      );
    };

    return (
      <td className="right">
        {rowType === 'update' && props.id === editableId && <CancelUpdate />}
        {props.rowType === 'update' && props.id !== editableId && <Delete />}
        {props.rowType === 'new' && <CancelNew />}
      </td>
    );
  };

  const RolesCell = (props: FileTypeRowProps) => {
    const { readRoles, updateRoles, cellType, rowType, anonymousRead } = props;
    const realmRoles = props.roles;
    const roles = cellType === 'readRoles' ? readRoles : updateRoles;
    let display = '';
    if (anonymousRead && cellType === 'readRoles') {
      display = 'Anonymous';
    } else {
      if (roles) {
        display = roles.join(', ');
      }
    }

    const displayOnly = !props.editable && rowType !== 'new';

    if (displayOnly) {
      return (
        <td>
          {anonymousRead || (cellType === 'readRoles' && <RoleSpan>Anonymous</RoleSpan>)}
          {(!anonymousRead || cellType === 'updateRoles') &&
            roles.map((role) => {
              return (
                <RoleSpan key={`${role}-${props.id}`} data-testid="new-roles">
                  {role}
                </RoleSpan>
              );
            })}
        </td>
      );
    }

    return (
      <td>
        <GoADropdown
          title=""
          subTitle=""
          display={display}
          data-testid={`${rowType}-${cellType}`}
          selectionChanged={(e) => {
            const fileType = { ...props };
            if (e.label === 'Anonymous' && cellType === 'readRoles') {
              fileType.anonymousRead = !anonymousRead;
            } else {
              if (e.selected) {
                roles.push(e.value);
              } else {
                const index = roles.indexOf(e.value);
                if (index > -1) {
                  roles.splice(index, 1);
                }
              }
            }
            if (cellType === 'updateRoles') {
              fileType.updateRoles = roles;
            }

            if (cellType === 'readRoles') {
              fileType.readRoles = roles;
            }

            if (rowType === 'update') {
              setUpdateFileType(fileType);
            }

            if (rowType === 'new') {
              setNewFileType(fileType);
            }
          }}
        >
          {cellType === 'readRoles' && (
            <GoAOption value="anonymousRead" label="Anonymous" key={'anonymous'} data-testid="anonymous-option">
              Anyone (Anonymous)
            </GoAOption>
          )}

          {!anonymousRead || cellType === 'updateRoles' ? (
            realmRoles.map((realmRole) => {
              return (
                <GoAOption
                  value={realmRole.name}
                  label={realmRole.name}
                  key={realmRole.id}
                  data-testid={`${rowType}-update-roles-options`}
                  selected={roles.includes(realmRole.name)}
                />
              );
            })
          ) : (
            <div></div>
          )}
        </GoADropdown>
      </td>
    );
  };

  const FileTypeRow = (props: FileTypeRowProps) => {
    const editable = props.editable === true;

    return (
      <tr className={editable ? 'selected' : ''}>
        <ActionCell {...{ ...props, rowType: 'update' }} />
        <NameCell editable={editable} {...props} />
        <RolesCell {...{ ...props, cellType: 'readRoles', rowType: 'update' }} />
        <RolesCell {...{ ...props, cellType: 'updateRoles', rowType: 'update' }} />
        <CancelCell {...{ ...props, rowType: 'update' }} />
      </tr>
    );
  };

  const DeleteModal = (props: FileTypeRowProps) => {
    const dispatch = useDispatch();
    const [hasFile, setHasFile] = useState<boolean>(null);
    const fileType = useSelector((state: RootState) =>
      state.fileService.fileTypes.filter((fileType) => {
        return fileType.id === props.id;
      })
    )[0];

    useEffect(() => {
      dispatch(FetchFileTypeHasFileService(props.id));
    }, []);

    useEffect(() => {
      if (fileType?.hasFile !== null) {
        setHasFile(fileType?.hasFile);
      } else {
        dispatch(FetchFileTypeHasFileService(props.id));
      }
    }, [fileType?.hasFile]);

    const CancelButton = () => {
      return (
        <GoAButton
          buttonType="secondary"
          onClick={() => {
            setShowDelete(false);
          }}
        >
          Cancel
        </GoAButton>
      );
    };

    return (
      <DeleteModalContainer>
        {hasFile === true && (
          <GoACallout type="important" date-testid="delete-modal">
            <h3>File type current in use</h3>
            <p>{`You are unable to delete the file type (${props.name}), because there are files within the file type`}</p>
            <CancelButton data-testid="cancel-delete-modal" />
          </GoACallout>
        )}

        {hasFile === false && (
          <GoACallout type="important" title="File type current in use">
            <p>{`Deleting the file type (${props.name}) will cause the related endpoints unavailable.`}</p>
            <p>
              <b>Are you sure you want to continue?</b>
            </p>
            <div className="right">
              <CancelButton data-testid="cancel-delete-modal-button" />
              <Gutter />
              <GoAButton
                data-testid="delete-modal-delete-button"
                onClick={() => {
                  dispatch(DeleteFileTypeService(props));
                }}
              >{`Delete ${props.name}`}</GoAButton>
            </div>
          </GoACallout>
        )}
      </DeleteModalContainer>
    );
  };

  const newEntryFn = () => {
    setStartCreateFileType(true);
    if (newFileType === null) {
      setNewFileType({
        anonymousRead: false,
        readRoles: [],
        updateRoles: [],
        name: '',
        id: uuid4(),
      });
    }
  };

  const NewFileTypeRow = (props: FileTypeRowProps) => {
    const [name, setName] = useState(props.name);
    const { id } = props;
    return (
      <>
        {startCreateFileType && (
          <tr className="selected" key={id}>
            <ActionCell {...{ ...props, rowType: 'new' }} />
            <td>
              <input
                onBlur={(e) => {
                  newFileType.name = e.target.value;
                  setNewFileType({ ...{ ...newFileType } });
                }}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                id="new-file-type-name"
                data-testid="new-file-type-name"
                value={name}
              />
            </td>
            <RolesCell {...{ ...props, rowType: 'new', cellType: 'readRoles' }} data-testid="new-read-roles-cell" />
            <RolesCell {...{ ...props, rowType: 'new', cellType: 'updateRoles' }} data-testid="new-update-roles-cell" />
            <CancelCell {...{ ...props, rowType: 'new' }} data-testid="cancel-new-cell" />
          </tr>
        )}
      </>
    );
  };

  return (
    <FileTypeTableContainer>
      <TitleContainer>
        <h3>File Types</h3>
        <GoAButton onClick={newEntryFn} data-testid="new-file-type-button-top">
          Add file type
        </GoAButton>
      </TitleContainer>

      {showDelete && <DeleteModal {...updateFileType} />}
      <DataTable>
        <thead>
          <tr>
            <th id="actions" data-testid="actions">
              Actions
            </th>
            <th id="name" date-testid="name">
              Name
            </th>
            <th id="read-roles" data-testid="read-roles">
              Who can read
            </th>
            <th id="write-roles" data-testid="write-roles">
              Who can write
            </th>
            <th id="cancel" className="right" data-testid="cancel">
              Settings
            </th>
          </tr>
        </thead>

        <tbody>
          {newFileType && <NewFileTypeRow {...{ ...newFileType, roles: props.roles }} />}
          {props.fileTypes.map((fileType) => {
            const rowId = `${fileType.id}`;
            if (fileType.id === editableId) {
              return (
                <FileTypeRow
                  key={rowId}
                  name={updateFileType.name}
                  readRoles={updateFileType.readRoles}
                  updateRoles={updateFileType.updateRoles}
                  anonymousRead={updateFileType.anonymousRead}
                  id={updateFileType.id}
                  roles={props.roles}
                  data-testid="update-file-type-row"
                  editable={true}
                  callback={(fileType: FileTypeItem) => {
                    setUpdateFileType(fileType);
                  }}
                />
              );
            }

            return (
              <FileTypeRow
                key={rowId}
                name={fileType.name}
                readRoles={fileType.readRoles}
                updateRoles={fileType.updateRoles}
                anonymousRead={fileType.anonymousRead}
                data-testid="update-file-type-row"
                id={fileType.id}
                roles={props.roles}
                editable={false}
              />
            );
          })}

          <tr>
            <td colSpan={5}>
              <GoAButton
                buttonType="secondary"
                buttonSize="small"
                onClick={newEntryFn}
                data-testid="new-file-type-button-bottom"
              >
                + New File Type
              </GoAButton>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </FileTypeTableContainer>
  );
};
