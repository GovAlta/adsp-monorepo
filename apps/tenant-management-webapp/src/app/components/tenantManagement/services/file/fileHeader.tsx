import React from 'react';
import './file.css';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/reducers';

const FileHeader = () => {
  const setup = useSelector(
    (state: RootState) => state.file.requirements.setup
  );
  const active = useSelector((state: RootState) => state.file.status.isActive);

  let headerState = '';
  let headerStateClass = '';

  if (setup) {
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
