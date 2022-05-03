import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadFileService,
  FetchFileTypeService,
  FetchCoreFileTypeService,
  FetchFilesService,
  DeleteFileService,
  DownloadFileService,
} from '@store/file/actions';
import { GoAButton, GoARadioGroup, GoARadio } from '@abgov/react-components';
import { GoAForm } from '@abgov/react-components/experimental';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { renderNoItem } from '@components/NoItem';
import { DeleteModal } from '@components/DeleteModal';
import { FileItem } from '@store/file/models';

const FileList = (): JSX.Element => {
  const [selectedFile, setSelectFile] = useState<FileItem>();
  const [uploadFileType, setUploadFileType] = useState<string>();
  const dispatch = useDispatch();

  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const coreFileTypes = useSelector((state: RootState) => state.fileService.coreFileTypes);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const getFileTypesValues = () => {
    const typeValues = [];

    if (fileTypes === null) {
      return typeValues;
    }

    fileTypes.forEach((fileType): void => {
      const type = {};
      type['text'] = fileType.name ? fileType.name : fileType.id;
      type['value'] = fileType.id;
      typeValues.push(type);
    });

    coreFileTypes.forEach((coreFileType): void => {
      const type = {};
      type['text'] = coreFileType.name ? coreFileType.name : coreFileType.id;
      type['value'] = coreFileType.id;
      typeValues.push(type);
    });
    return typeValues;
  };

  const onFormSubmit = (event) => {
    event.preventDefault();
    const fileInfo = { file: selectedFile, type: uploadFileType };
    dispatch(UploadFileService(fileInfo));
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
    dispatch(FetchCoreFileTypeService());
  }, [dispatch]);

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
        <h2>Please upload a file</h2>

        <input type="file" onChange={onChange} aria-label="file upload" />
        <GoARadioGroup
          orientation="vertical"
          name="fileSecurityOptions"
          value={uploadFileType}
          onChange={(_name, value) => {
            setUploadFileType(value);
          }}
        >
          {getFileTypesValues().map((item) => (
            <GoARadio key={item.value} value={item.value} checked={false}>
              {item.text}
            </GoARadio>
          ))}
        </GoARadioGroup>
        <GoAButton type="submit" disabled={!selectedFile} onClick={onFormSubmit}>
          Upload
        </GoAButton>
      </GoAForm>

      {fileList?.length === 0 && renderNoItem('file')}
      {fileList?.length > 0 && renderFileTable()}
    </>
  );
};

export default FileList;
