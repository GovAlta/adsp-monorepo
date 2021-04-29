import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const FileSpace = () => {
  const spaceName = useSelector((state: RootState) => state.fileService.space ?? 'N/A');

  return (
    <div>
      <p>Space Name: {spaceName}</p>
    </div>
  );
};

export default FileSpace;
