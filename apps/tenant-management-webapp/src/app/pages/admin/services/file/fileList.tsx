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
import { GoAForm } from '@components/Form';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { Main } from '@components/Html';
import DownloadIcon from '@icons/download-outline.svg';
import DeleteIcon from '@icons/trash-outline.svg';
import './file.css';

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
    // eslint-disable-next-line
    fileTypes.map((fileType): void => {
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

  return (
    <Main>
      <GoAForm>
        <h3>Please upload a File</h3>

        <input type="file" onChange={onChange} />
        <GoARadioGroup
          orientation="vertical"
          name="fileSecurityOptions"
          value={uploadFileType}
          onChange={(e) => {
            setUploadFileType(e);
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
      <DataTable id="files-information">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Size</th>
            <th>type</th>
            <th>FileURN</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {fileList.map((file) => {
            return (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{file.size}</td>
                <td>{file.typeName}</td>
                <td>{file.fileURN}</td>
                <td>
                  <img src={DownloadIcon} width="26" alt="download file" onClick={(e) => onDownloadFile(file)} />
                  <img src={DeleteIcon} width="26" alt="delete file" onClick={(e) => onDeleteFile(file)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </Main>
  );
};

export default FileList;
