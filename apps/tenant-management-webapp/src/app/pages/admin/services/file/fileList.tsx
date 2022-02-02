import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadFileService,
  FetchFileTypeService,
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
const FileList = (): JSX.Element => {
  const [selectedFile, setSelectFile] = useState<string>();
  const [uploadFileType, setUploadFileType] = useState<string>();
  const dispatch = useDispatch();
  const { fileList, fileTypes } = useSelector((state: RootState) => {
    return {
      fileList: state.fileService.fileList || [],
      fileTypes: state.fileService.fileTypes || [],
    };
  });
  const getFileTypesValues = () => {
    const typeValues = [];

    fileTypes.forEach((fileType): void => {
      const type = {};
      type['text'] = fileType.name ? fileType.name : fileType.id;
      type['value'] = fileType.id;
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
    dispatch(DeleteFileService(file.id));
  };

  useEffect(() => {
    dispatch(FetchFilesService());
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  const renderFileTable = () => {
    return (
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

      {fileList.length === 0 ? renderNoItem('file') : renderFileTable()}
    </>
  );
};

export default FileList;
