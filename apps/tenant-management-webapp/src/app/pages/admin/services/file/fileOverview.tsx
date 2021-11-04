import React, { FunctionComponent } from 'react';

const FileOverview: FunctionComponent = () => {
  return (
    <div>
      <div>
        The file service provides the capability to upload and download files. Consumers are registered with their own
        space (tenant) containing file types that include role based access policy, and can associate files to domain
        records.
      </div>
      <h3>File types</h3>
      <div>
        File types describe categories of files and include configuration of roles permitted to access and updated
        files.
      </div>
    </div>
  );
};
export default FileOverview;
