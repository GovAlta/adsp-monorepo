import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import styled from 'styled-components';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import InformationCircle from '@components/icons/InformationCircle';

const JobList = (): JSX.Element => {
  const dispatch = useDispatch();
  const fileList = useSelector((state: RootState) => state.fileService.fileList);

  const onDownloadFile = async (file) => {
    dispatch(DownloadFileService(file));
  };

  const jobList = useSelector((state: RootState) => state.pdf.jobs);

  const statusGenerator = {
    queued: 'Queued',
    'pdf-generation-queued': 'Queued',
    'pdf-generated': 'Generated',
    'pdf-generation-failed': 'Failed',
  };
  const iconGenerator = {
    queued: <InformationCircle size="medium" />,
    'pdf-generation-queued': <InformationCircle size="medium" />,
    'pdf-generated': <CheckmarkCircle size="medium" />,
    'pdf-generation-failed': <CloseCircle size="medium" />,
  };

  const renderFileTable = () => {
    return (
      <FileTableStyles>
        {jobList.length > 0 && (
          <DataTable id="files-information">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Status</th>
                <th>Size (KB)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobList.map((job, key) => {
                const file = fileList.find((file) => file.recordId === job.id);
                const status = file?.filename ? 'pdf-generated' : job.status;
                return (
                  <tr key={job.id}>
                    <td>{job.filename}</td>
                    {/* Use ceil here to make sure people will allocate enough resources */}
                    <td>
                      <div className="flex-horizontal mt-2">
                        <div className="mt-1">{iconGenerator[status]}</div>
                        <div className="flex">{statusGenerator[status]}</div>
                      </div>
                    </td>
                    <td>
                      {file?.size ? (
                        Math.ceil(file.size / 1024)
                      ) : (
                        <GoASkeletonGridColumnContent key={job.id} rows={1}></GoASkeletonGridColumnContent>
                      )}
                    </td>
                    <td>
                      {file?.filename ? (
                        <GoAIconButton
                          disabled={!file?.size}
                          data-testid="download-icon"
                          size="medium"
                          type="download"
                          onClick={() => onDownloadFile(file)}
                        />
                      ) : (
                        <GoASkeletonGridColumnContent key={key} rows={1}></GoASkeletonGridColumnContent>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </FileTableStyles>
    );
  };

  return <>{fileList?.filter((f) => f.typeName === 'Generated PDF').length > 0 && renderFileTable()}</>;
};

export default JobList;

const FileTableStyles = styled.div`
  .flex-horizontal {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }

  .mt-1 {
    margin-top: 2px;
  }

  .mt-2 {
    margin-top: 4px;
  }
`;
