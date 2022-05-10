import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadFileService,
  FetchFileTypeService,
  FetchFilesService,
  DeleteFileService,
  DownloadFileService,
} from '@store/file/actions';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { GoAForm } from '@abgov/react-components/experimental';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { renderNoItem } from '@components/NoItem';
import { DeleteModal } from '@components/DeleteModal';
import { FileItem } from '@store/file/models';
import { PageIndicator } from '@components/Indicator';
import styled from 'styled-components';

const FileList = (): JSX.Element => {
  const [selectedFile, setSelectFile] = useState<FileItem>(null);
  const [uploadFileType, setUploadFileType] = useState<string[]>([]);
  const dispatch = useDispatch();

  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const coreFileTypes = useSelector((state: RootState) => state.fileService.coreFileTypes);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const getFileTypesValues = () => {
    let dropdownFileTypes = [];
    if (fileTypes && coreFileTypes) {
      dropdownFileTypes = [...fileTypes, ...coreFileTypes];
    }
    return dropdownFileTypes;
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const onUploadSubmit = (event) => {
    event.preventDefault();
    const fileInfo = { file: selectedFile, type: uploadFileType[0] };
    dispatch(UploadFileService(fileInfo));
    setUploadFileType([]);
    setSelectFile(null);
  };

  const onChange = (event) => {
    setSelectFile(event.target.files[0]);
  };

  const onDownloadFile = async (file) => {
    dispatch(DownloadFileService(file));
  };
  const onDeleteFile = (file) => {
    setSelectFile(file);
    setShowDeleteConfirmation(true);
  };

  useEffect(() => {
    dispatch(FetchFilesService());
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

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
            {fileList.map((file) => {
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
  return (
    <>
      <GoAForm>
        <UploadHeading>Please upload a file</UploadHeading>
        <input type="file" onChange={onChange} aria-label="file upload" />
        <FileTypeDropdown>
          <GoADropdown
            name="fileType"
            selectedValues={uploadFileType}
            multiSelect={false}
            onChange={(name, values) => {
              setUploadFileType(values);
            }}
          >
            {getFileTypesValues().map((item) => (
              <GoADropdownOption label={item.name} value={item.name} key={item.id} data-testid={item.id} />
            ))}
          </GoADropdown>
        </FileTypeDropdown>

        <GoAButton type="submit" disabled={!(selectedFile && uploadFileType.length > 0)} onClick={onUploadSubmit}>
          Upload
        </GoAButton>
      </GoAForm>
      <br />
      {!indicator.show && fileList?.length === 0 && renderNoItem('file')}
      {indicator.show && <PageIndicator />}
      {!indicator.show && fileList?.length > 0 && renderFileTable()}
    </>
  );
};

export default FileList;

const FileTypeDropdown = styled.div`
  margin-bottom: 1rem;
  margin-top: 1rem;
  width: '500px';
`;

const UploadHeading = styled.div`
  margin-bottom: 1rem;
  font-weight: var(--fw-bold);
`;
