import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteFileService, DownloadFileService } from '@store/file/actions';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { DeleteModal } from '@components/DeleteModal';
import { FileItem } from '@store/file/models';

const FileList = (): JSX.Element => {
  const [selectedFile, setSelectFile] = useState<FileItem>(null);
  const dispatch = useDispatch();
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const onDownloadFile = async (file) => {
    dispatch(DownloadFileService(file));
  };
  const onDeleteFile = (file) => {
    setSelectFile(file);
    setShowDeleteConfirmation(true);
  };

  // // eslint-disable-next-line
  // useEffect(() => {}, [indicator]);

  const renderFileTable = () => {
    return (
      <div>
        <DataTable id="files-information">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Size (KB)</th>
              <th>type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fileList
              .filter((f) => f.typeName === 'Generated PDF')
              .map((file) => {
                return (
                  <tr key={file.id}>
                    <td>{file.filename}</td>
                    {/* Use ceil here to make sure people will allocate enough resouces */}
                    <td>{Math.ceil(file.size / 1024)}</td>
                    <td>{file.typeName}</td>
                    <td>
                      <GoAIconButton
                        data-testid="download-icon"
                        size="medium"
                        type="download"
                        onClick={() => onDownloadFile(file)}
                      />
                      <GoAIconButton
                        data-testid="delete-icon"
                        size="medium"
                        type="trash"
                        onClick={() => onDeleteFile(file)}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </DataTable>

        {showDeleteConfirmation && (
          <DeleteModal
            isOpen={showDeleteConfirmation}
            title="Delete file"
            content={`Delete file ${selectedFile?.filename} ?`}
            onCancel={() => setShowDeleteConfirmation(false)}
            onDelete={() => {
              setShowDeleteConfirmation(false);
              dispatch(DeleteFileService(selectedFile?.id));
            }}
          />
        )}
      </div>
    );
  };
  return <>{!indicator.show && fileList?.length > 0 && renderFileTable()}</>;
};

export default FileList;
