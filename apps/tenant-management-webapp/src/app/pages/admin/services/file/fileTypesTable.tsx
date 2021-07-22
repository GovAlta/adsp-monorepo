import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { Gutter } from '@components/Gutter';
import { GoAButton, GoADropdown, GoAOption, GoACallout } from '@abgov/react-components';
import { FileTypeItem } from '@store/file/models';
import { useDispatch } from 'react-redux';
import { v4 as uuid4 } from 'uuid';

import { DeleteFileTypeService, CreateFileTypeService, UpdateFileTypeService } from '@store/file/actions';
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
    width: 15%;
  }
  td:nth-child(2) {
    width: 30%;
  }
  td:nth-child(3) {
    width: 30%;
  }
  td:nth-child(4) {
    width: 25%;
  }
`;

interface FileTypeRowProps {
  name: string;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  id: string;
  editable?: boolean;
  roles?;
  callback?: (updatedFileType: FileTypeItem) => void;
  cellType?: 'readRoles' | 'updateRoles';
  rowType?: 'update' | 'new';
}

interface FileTypeTableProps {
  roles;
  fileTypes;
}

export const FileTypeTable = (props: FileTypeTableProps) => {
  const { roles, fileTypes } = props;
  if (roles === null || fileTypes === []) {
    return <div></div>;
  }

  const [editableId, setEditableId] = useState('');
  const [startCreateFileType, setStartCreateFileType] = useState(false);
  const newTypeNameRef = useRef<HTMLInputElement>(null);
  const [updateFileType, setUpdateFileType] = useState<FileTypeItem>(null);
  const [newFileType, setNewFileType] = useState<FileTypeItem>(null);

  const NameCell = (props: FileTypeRowProps) => {
    return <td>{props.editable ? <input ref={newTypeNameRef} placeholder={props.name} /> : props.name}</td>;
  };

  const ActionCell = (props: FileTypeRowProps) => {
    const { rowType } = props;
    const dispatch = useDispatch();
    const Delete = () => {
      return <a onClick={() => {}}>Delete</a>;
    };

    const Create = () => {
      return (
        <a
          onClick={() => {
            console.log(newFileType);
            dispatch(CreateFileTypeService({ ...newFileType }));
          }}
        >
          Create
        </a>
      );
    };

    const Save = () => {
      return (
        <a
          onClick={() => {
            dispatch(UpdateFileTypeService(props));
          }}
        >
          Save
        </a>
      );
    };
    return (
      <td className="right">
        {rowType === 'update' && props.id === editableId && (
          <>
            <Save />
            <Gutter />
            <Delete />
          </>
        )}
        {props.rowType === 'update' && props.id !== editableId && <Delete />}
        {props.rowType === 'new' && <Create />}
      </td>
    );
  };

  const RolesCell = (props: FileTypeRowProps) => {
    const { readRoles, updateRoles, cellType, rowType } = props;
    const realmRoles = props.roles;
    let roles = cellType === 'readRoles' ? readRoles : updateRoles;
    let display = '';
    if (props.anonymousRead && cellType === 'readRoles') {
      display = 'Anonymous';
    } else {
      if (roles) {
        display = roles.join(', ');
      }
    }

    return (
      <td>
        <GoADropdown
          title=""
          subTitle=""
          display={display}
          disabled={!props.editable && rowType !== 'new'}
          selectionChanged={(e) => {
            const fileType = { ...props };
            if (e.label === 'Anonymous') {
              fileType.anonymousRead = !props.anonymousRead;
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
            <GoAOption value="anonymousRead" label="Anonymous" key={'anonymous'}>
              Anyone (Anonymous)
            </GoAOption>
          )}

          {!props.anonymousRead || cellType === 'updateRoles' ? (
            realmRoles.map((realmRole) => {
              return (
                <GoAOption
                  value={realmRole.name}
                  label={realmRole.name}
                  key={realmRole.id}
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
      <tr
        onClick={() => {
          if (editableId !== props.id) {
            setEditableId(props.id);
            // When we select a new line, we will lose unsaved information
            setUpdateFileType({ ...props });
            console.log(updateFileType);
          }
        }}
        className={editable ? 'selected' : ''}
      >
        <NameCell editable={editable} {...props} />
        <RolesCell {...{ ...props, cellType: 'readRoles', rowType: 'update' }} />
        <RolesCell {...{ ...props, cellType: 'updateRoles', rowType: 'update' }} />
        <ActionCell {...{ ...props, rowType: 'update' }} />
      </tr>
    );
  };

  const DeleteModal = () => {};

  const NewEntryRow = (props: FileTypeRowProps) => {
    const [name, setName] = useState(props.name);
    return (
      <>
        {startCreateFileType && (
          <tr className="selected">
            <td>
              <input
                onBlur={(e) => {
                  setNewFileType({ ...newFileType, name: e.target.value });
                }}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                value={name}
              />
            </td>
            <RolesCell {...{ ...props, rowType: 'new', cellType: 'readRoles' }} />
            <RolesCell {...{ ...props, rowType: 'new', cellType: 'updateRoles' }} />
            <ActionCell {...{ ...props, rowType: 'new' }} />
          </tr>
        )}
      </>
    );
  };

  return (
    <FileTypeTableContainer>
      <TitleContainer>
        <h3>File Types</h3>
        <GoAButton
          onClick={() => {
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
          }}
        >
          Add file type
        </GoAButton>
      </TitleContainer>
      <DataTable>
        <thead>
          <tr>
            <th id="name">Name</th>
            <th id="read-roles">Who can read</th>
            <th id="write-roles">Who can write</th>
            <th id="actions" className="right">
              Settings
            </th>
          </tr>
        </thead>

        <tbody>
          {newFileType && <NewEntryRow {...{ ...newFileType, roles: props.roles }} />}
          {props.fileTypes.map((fileType, index) => {
            const rowId = `row-${index}`;

            if (fileType.id === editableId) {
              console.log(props.roles);
              return (
                <FileTypeRow
                  key={rowId}
                  name={updateFileType.name}
                  readRoles={updateFileType.readRoles}
                  updateRoles={updateFileType.updateRoles}
                  anonymousRead={updateFileType.anonymousRead}
                  id={updateFileType.id}
                  roles={props.roles}
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
                id={fileType.id}
                roles={props.roles}
                editable={false}
              />
            );
          })}
        </tbody>
      </DataTable>
    </FileTypeTableContainer>
  );
};
