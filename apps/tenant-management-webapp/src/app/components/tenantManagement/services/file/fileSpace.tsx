import React from 'react';
import { useSelector } from 'react-redux';
import * as _ from 'lodash';

const FileSpace = () => {

  const spaceName = useSelector((state) => _.get(state, 'File.spaces[0].name'));

  return (
    <div>
      <p>
        {spaceName}
      </p>
    </div>
  );
};

export default FileSpace;
