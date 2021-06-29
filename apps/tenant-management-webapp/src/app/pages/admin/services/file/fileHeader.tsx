import React from 'react';
import './file.css';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
interface FileHeaderProps {
  isActive: boolean;
  isSetup: boolean;
}

const FileHeader = (props: FileHeaderProps) => {
  const roles = useSelector((state: RootState) => state.session?.realmAccess?.roles);
  const accessible = roles && roles.includes('file-service-admin');

  let headerState = '';
  let headerStateClass = '';

  if (!props.isSetup || !accessible) {
    if (props.isActive) {
      headerState = 'Active';
      headerStateClass = 'file-header-tag-active';
    } else {
      headerState = 'Inactive';
      headerStateClass = 'file-header-tag-inactive';
    }
  }
  return (
    <>
      <h2 className="file-header">File Services</h2>
      <span className={headerStateClass}>{headerState}</span>
    </>
  );
};

export default FileHeader;
