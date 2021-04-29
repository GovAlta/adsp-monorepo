import React from 'react';
import './file.css';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const FileHeader = () => {
  const setup = useSelector((state: RootState) => state.fileService.requirements.setup);
  const active = useSelector((state: RootState) => state.fileService.status.isActive);
  const roles = useSelector((state: RootState) => state.session.realmAccess.roles);

  const accessible = roles.includes('file-service-admin');

  let headerState = '';
  let headerStateClass = '';

  if (setup || !accessible) {
    headerState = 'Disabled';
    headerStateClass = 'file-header-tag-disabled';
  } else {
    if (active) {
      headerState = 'Active';
      headerStateClass = 'file-header-tag-active';
    } else {
      headerState = 'Inactive';
      headerStateClass = 'file-header-tag-inactive';
    }
  }
  return (
    <div className="file-header-div">
      <h2 className="file-header">File Services</h2>
      <span className={headerStateClass}>{headerState}</span>
    </div>
  );
};

export default FileHeader;
