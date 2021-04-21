import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { UploadFileService, FetchFileTypeService } from '@store/file/actions';
import { GoAButton } from '@abgov/react-components';
import { GoAForm } from '@components/Form';

const FileList = () => {
  const [selectedFile, setSelectFile] = useState<string>();
  const dispatch = useDispatch();
  const onFormSubmit = (event) => {
    event.preventDefault();
    dispatch(UploadFileService(selectedFile));
  };
  const onChange = (event) => {
    setSelectFile(event.target.files[0]);
  };
  useEffect(() => {
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  return (
    <GoAForm>
      <h3>Please upload a File</h3>

      <input type="file" onChange={onChange} />
      <GoAButton type="submit" disabled={!selectedFile} onClick={onFormSubmit}>
        Upload
      </GoAButton>
    </GoAForm>
  );
};

export default FileList;
