import React from 'react';
import './file.css';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const FileHeader = (): JSX.Element => {
  const roles = useSelector((state: RootState) => state.session?.realmAccess?.roles);
  const accessible = roles && roles.includes('file-service-admin');

  let headerState = '';
  let headerStateClass = '';

  if (!accessible) {
    headerState = 'Active';
    headerStateClass = 'file-header-tag-active';
  }

  return (
    <>
      <h2 className="file-header">File Services</h2>
      <span className={headerStateClass}>{headerState}</span>
    </>
  );
};

export default FileHeader;
