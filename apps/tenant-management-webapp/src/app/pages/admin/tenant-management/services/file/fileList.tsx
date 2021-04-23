import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UploadFileService, FetchFileTypeService, FetchFilesService } from '@store/file/actions';
import { GoAButton } from '@abgov/react-components';
import { GoAForm } from '@components/Form';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { Main } from '@components/Html';

const FileList = () => {
  const [selectedFile, setSelectFile] = useState<string>();

  const dispatch = useDispatch();
  const { files } = useSelector((state: RootState) => {
    return {
      files: state.file.fileList || [],
    };
  });

  const onFormSubmit = (event) => {
    event.preventDefault();
    dispatch(UploadFileService(selectedFile));
  };

  const onChange = (event) => {
    setSelectFile(event.target.files[0]);
  };

  useEffect(() => {
    dispatch(FetchFileTypeService());
    dispatch(FetchFilesService());
  }, [dispatch]);

  return (
    <Main>
      <GoAForm>
        <h3>Please upload a File</h3>

        <input type="file" onChange={onChange} />
        <GoAButton type="submit" disabled={!selectedFile} onClick={onFormSubmit}>
          Upload
        </GoAButton>
      </GoAForm>
      <DataTable id="files-information">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Size</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            return (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{file.size}</td>
                <td>{file.fileURN}</td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </Main>
  );
};

export default FileList;
