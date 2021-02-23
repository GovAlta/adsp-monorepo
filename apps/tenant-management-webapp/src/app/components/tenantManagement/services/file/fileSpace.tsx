import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/reducers';

const FileSpace = () => {
  const spaceName = useSelector(
    (state: RootState) => state.file.spaces[0]?.name
  );

  return (
    <div>
      <p>Space Name: {spaceName}</p>
    </div>
  );
};

export default FileSpace;
