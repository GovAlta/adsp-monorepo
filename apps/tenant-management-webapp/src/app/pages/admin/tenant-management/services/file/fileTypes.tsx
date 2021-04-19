import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import './file.css';
import {
  FetchFileTypeService,
  DeleteFileTypeService,
  CreateFileTypeService,
  UpdateFileTypeService,
} from '@store/file/actions';
import { Dropdown, Button, Form } from 'react-bootstrap';
import { RootState } from '@store/index';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MaterialTable from 'material-table';
import { FileTypeItem } from '@store/file/models';

interface TableData {
  id: string;
}

interface RowData {
  name: string;
  tableData: TableData;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
}

export default function FileTypes() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [addUpdateRole, setAddUpdateRole] = useState('');
  const [addReadRole, setAddReadRole] = useState('');
  const [updateRoleInput, setUpdateRoleInput] = useState('');
  const [readRoleInput, setReadRoleInput] = useState('');
  const [updateReadRole, setUpdateReadRole] = useState('');
  const [updateUpdateRole, setUpdateUpdateRole] = useState('');
  const [updateReadRoleInput, setUpdateReadRoleInput] = useState('');
  const [updateUpdateRoleInput, setUpdateUpdateRoleInput] = useState('');
  const [editName, setEditName] = useState('');
  const [editNameInput, setEditNameInput] = useState('');
  const [lastActiveTab, setLastActiveTab] = useState('');

  const activeTab = useSelector((state: RootState) => state.file.states.activeTab);

  if (activeTab !== lastActiveTab) {
    setLoading(true);
    setLastActiveTab(activeTab);
  }

  if (activeTab === 'file-types' && loading) {
    dispatch(FetchFileTypeService());
    setLoading(false);
  }

  const deleteFileType = (fileType) => {
    dispatch(DeleteFileTypeService(fileType));
  };

  const createFileType = (fileType) => {
    dispatch(CreateFileTypeService(fileType));
  };

  const updateFileType = (fileType) => {
    dispatch(UpdateFileTypeService(fileType));
  };

  const addUpdateRoleSubmit = (item, e) => {
    const { tableData, ...fileTypeToUpdate } = item;
    fileTypeToUpdate.updateRoles.push(updateRoleInput);
    setUpdateRoleInput(null);
    e.preventDefault();
    setAddUpdateRole(null);
    updateFileType(fileTypeToUpdate);
  };

  const addReadRoleSubmit = (item, e) => {
    const { tableData, ...fileTypeToUpdate } = item;
    fileTypeToUpdate.readRoles.push(readRoleInput);
    setReadRoleInput(null);
    setAddReadRole(null);
    updateFileType(fileTypeToUpdate);
    e.preventDefault();
  };

  const updateReadRoleSubmit = (item, e) => {
    const { tableData, ...fileTypeToUpdate } = item;
    fileTypeToUpdate.readRoles = updateReadRoleInput.split(',');
    setUpdateReadRoleInput(null);
    setUpdateReadRole(null);
    updateFileType(fileTypeToUpdate);
    e.preventDefault();
  };

  const updateUpdateRoleSubmit = (item, e) => {
    const { tableData, ...fileTypeToUpdate } = item;
    fileTypeToUpdate.updateRoles = updateUpdateRoleInput.split(',');
    setUpdateUpdateRoleInput(null);
    e.preventDefault();
    setUpdateUpdateRole(null);
    updateFileType(fileTypeToUpdate);
  };

  const updateNameSubmit = (item, e) => {
    const { tableData, ...fileTypeToUpdate } = item;
    fileTypeToUpdate.name = editNameInput;
    setEditNameInput(null);
    e.preventDefault();
    setEditName('');
    updateFileType(fileTypeToUpdate);
  };

  const updateAnonSubmit = (item, e) => {
    e.preventDefault();
    const { tableData, ...fileTypeToUpdate } = item;
    fileTypeToUpdate.anonymousRead = e.target.value === 'true';
    updateFileType(fileTypeToUpdate);
  };

  const setEditNameStates = (item) => {
    setEditName(item.tableData.id);
    setEditNameInput(item.name);
  };

  const fileTypes = useSelector((state: RootState) => state.file.fileTypes);

  let types = null;
  if (fileTypes && fileTypes.length > 0) {
    types = fileTypes.map((fileType, ix) => <Dropdown.Item href={`#/${fileType.name}`}>{fileType.name}</Dropdown.Item>);
  }

  const setAddUpdateRoleHandler = (id) => {
    if (id === addUpdateRole) {
      setAddUpdateRole(null);
    } else {
      setAddUpdateRole(id);
    }
  };

  const setUpdateUpdateRoleHandler = (id) => {
    if (id === updateUpdateRole) {
      setUpdateUpdateRole(null);
    } else {
      setUpdateUpdateRoleInput(fileTypes[id].updateRoles.toString());
      setUpdateUpdateRole(id);
    }
  };

  const setUpdateReadRoleHandler = (id) => {
    if (id === updateReadRole) {
      setUpdateReadRole(null);
    } else {
      setUpdateReadRoleInput(fileTypes[id].readRoles.toString());
      setUpdateReadRole(id);
    }
  };

  const setAddReadRoleHandler = (id) => {
    if (id === addReadRole) {
      setAddReadRole(null);
    } else {
      setAddReadRole(id);
    }
  };

  const fileTypeTable = () => {
    return (
      <MaterialTable
        columns={[
          {
            title: 'Name',
            field: 'name',
            render: (rowData: FileTypeItem) => {
              return (
                <div>
                  {rowData.tableData.id !== editName ? (
                    <Button className="blended-button" onClick={() => setEditNameStates(rowData)}>
                      {rowData.name}
                    </Button>
                  ) : (
                    <Form>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Form.Group style={{ flex: 2 }} controlId="addReadRole">
                          <Form.Control
                            type="updateRole"
                            placeholder="Enter role"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                          />
                        </Form.Group>
                        <Button
                          variant="primary"
                          style={{
                            borderRadius: '42px',
                            padding: '4px 8px 3px 8px',
                            margin: '4px',
                          }}
                          type="submit"
                          onClick={(e) => updateNameSubmit(rowData, e)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </Button>
                      </div>
                    </Form>
                  )}
                </div>
              );
            },
          },
          {
            title: 'Read Roles',
            field: 'readRoles',
            render: (rowData: FileTypeItem) => {
              let readRoles = null;

              if (rowData && rowData.readRoles) {
                readRoles = rowData.readRoles.map((role, ix) => (
                  <React.Fragment>
                    {role} {ix === rowData.readRoles.length - 1 ? '' : ','}
                  </React.Fragment>
                ));
              }

              return (
                <React.Fragment>
                  {rowData.tableData.id !== updateReadRole ? (
                    <Button className="blended-button" onClick={() => setUpdateReadRoleHandler(rowData.tableData.id)}>
                      {readRoles}
                    </Button>
                  ) : (
                    <Form>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Form.Group style={{ flex: 2 }} controlId="addReadRole">
                          <Form.Control
                            type="updateRole"
                            placeholder="Enter role"
                            value={updateReadRoleInput}
                            onChange={(e) => setUpdateReadRoleInput(e.target.value)}
                          />
                        </Form.Group>
                        <Button
                          variant="primary"
                          style={{
                            borderRadius: '42px',
                            padding: '4px 8px 3px 8px',
                            margin: '4px',
                          }}
                          type="submit"
                          onClick={(e) => updateReadRoleSubmit(rowData, e)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </Button>
                      </div>
                    </Form>
                  )}

                  <Button
                    variant="primary"
                    style={{ borderRadius: '22px', padding: '0 8px 3px 8px' }}
                    aria-describedby=""
                    onClick={() => setAddReadRoleHandler(rowData.tableData.id)}
                  >
                    {rowData.tableData.id === addReadRole ? '-' : '+'}
                  </Button>
                  {rowData.tableData.id === addReadRole && (
                    <Form>
                      <Form.Group controlId="addReadRole">
                        <Form.Control
                          type="updateRole"
                          placeholder="Enter role"
                          onChange={(e) => setReadRoleInput(e.target.value)}
                        />
                      </Form.Group>
                      <Button
                        variant="primary"
                        style={{
                          borderRadius: '22px',
                          padding: '4px 8px 3px 8px',
                          margin: '4px',
                        }}
                        type="submit"
                        onClick={(e) => addReadRoleSubmit(rowData, e)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </Button>
                    </Form>
                  )}
                </React.Fragment>
              );
            },
          },
          {
            title: 'Update Roles',
            field: 'updateRoles',
            render: (rowData: FileTypeItem, index) => {
              let updateRoles = null;

              if (rowData && rowData.updateRoles) {
                updateRoles = rowData.updateRoles.map((role, ix) => {
                  return (
                    <React.Fragment>
                      {role} {ix === rowData.updateRoles.length - 1 ? '' : ','}
                    </React.Fragment>
                  );
                });
              }
              return (
                <React.Fragment>
                  {rowData.tableData.id !== updateUpdateRole ? (
                    <Button className="blended-button" onClick={() => setUpdateUpdateRoleHandler(rowData.tableData.id)}>
                      {updateRoles}
                    </Button>
                  ) : (
                    <Form>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Form.Group style={{ flex: 2 }} controlId="addReadRole">
                          <Form.Control
                            type="updateRole"
                            placeholder="Enter role"
                            value={updateUpdateRoleInput}
                            onChange={(e) => setUpdateUpdateRoleInput(e.target.value)}
                          />
                        </Form.Group>
                        <Button
                          variant="primary"
                          style={{
                            borderRadius: '42px',
                            padding: '4px 8px 3px 8px',
                            margin: '4px',
                          }}
                          type="submit"
                          onClick={(e) => updateUpdateRoleSubmit(rowData, e)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </Button>
                      </div>
                    </Form>
                  )}

                  <Button
                    variant="primary"
                    style={{ borderRadius: '42px', padding: '0 8px 3px 8px' }}
                    aria-describedby=""
                    onClick={() => setAddUpdateRoleHandler(rowData.tableData.id)}
                  >
                    {rowData.tableData.id === addUpdateRole ? '-' : '+'}
                  </Button>
                  {rowData.tableData.id === addUpdateRole && (
                    <Form>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <div style={{ flex: 2 }}>
                          <Form.Group controlId="addUpdateRole">
                            <Form.Control
                              type="updateRole"
                              placeholder="Enter role"
                              onChange={(e) => setUpdateRoleInput(e.target.value)}
                            />
                          </Form.Group>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Button
                            style={{
                              borderRadius: '42px',
                              padding: '4px 8px 3px 8px',
                              margin: '4px',
                            }}
                            variant="primary"
                            type="submit"
                            onClick={(e) => addUpdateRoleSubmit(rowData, e)}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </Button>
                        </div>
                      </div>
                    </Form>
                  )}
                </React.Fragment>
              );
            },
          },
          {
            title: 'Anonymous Read',
            field: 'anonymousRead',
            render: (rowData: FileTypeItem) => {
              return (
                <div>
                  <Form.Group controlId="controlSelect1">
                    <Form.Control as="select" onChange={(e) => updateAnonSubmit(rowData, e)}>
                      <option value="true" selected={rowData.anonymousRead ? true : false}>
                        true
                      </option>
                      <option value="false" selected={rowData.anonymousRead ? false : true}>
                        false
                      </option>
                    </Form.Control>
                  </Form.Group>
                </div>
              );
            },
          },
        ]}
        data={fileTypes}
        title="File Types"
        options={{
          paging: false,
        }}
        editable={{
          onRowAdd: (newData) =>
            new Promise<void>((resolve, reject) => {
              setTimeout(() => {
                createFileType(newData);
                resolve();
              }, 1000);
            }),
        }}
        actions={[
          {
            icon: 'delete',
            tooltip: 'Move to Trash',
            onClick: (event, rows) => {
              deleteFileType(rows);
            },
          },
        ]}
      />
    );
  };
  const state = useSelector((state: RootState) => state);
  const noSpace = () => {
    return (
      <div>
        There is no space
        {JSON.stringify(state.file)}
      </div>
    );
  };

  const fileSpace = useSelector((state: RootState) => state.file.space);
  return <div>{fileSpace && !loading ? fileTypeTable() : noSpace()}</div>;
}
