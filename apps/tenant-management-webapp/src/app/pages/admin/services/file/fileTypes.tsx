import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import './file.css';
import {
  FetchFileTypeService,
  DeleteFileTypeService,
  CreateFileTypeService,
  UpdateFileTypeService,
} from '@store/file/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { Dropdown, Button, Form } from 'react-bootstrap';
import { RootState } from '@store/index';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { GoAButton } from '@abgov/react-components';
import styled from 'styled-components';
import { FileTypeTable } from './fileTypesTable';

interface TableData {
  id: string;
}

// interface RowData {
//   name: string;
//   tableData: TableData;
//   readRoles: string[];
//   updateRoles: string[];
//   anonymousRead: boolean;
//}

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
  const fileSpace = useSelector((state: RootState) => state.fileService.space);
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes) || [];

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(FetchFileTypeService());
  }, []);

  useEffect(() => {}, [fileTypes]);

  const NoSpace = () => {
    return <div>There is no space</div>;
  };

  return (
    <div>
      <div></div>
      <div>{fileSpace ? <FileTypeTable roles={realmRoles} fileTypes={fileTypes} /> : <NoSpace />}</div>
    </div>
  );
}
