import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadFileService,
  FetchFileTypeService,
  FetchFilesService,
  DeleteFileService,
  DownloadFileService,
} from '@store/file/actions';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import {
  GoAIconButton,
  GoAForm,
  GoAFormItem,
  GoAFlexRow,
  GoAInputText,
  GoAFormActions,
} from '@abgov/react-components/experimental';
import { renderNoItem } from '@components/NoItem';
import { DeleteModal } from '@components/DeleteModal';
import { FileItem } from '@store/file/models';
import { PageIndicator } from '@components/Indicator';

import styled from 'styled-components';

const FileList = (): JSX.Element => {
  const [selectedFile, setSelectFile] = useState<FileItem>(null);
  const [uploadFileType, setUploadFileType] = useState<string[]>([]);
  const [filterFileType, setFilterFileType] = useState<string>(null);
  const [searchName, setSearchName] = useState<string>('');
  const dispatch = useDispatch();
  const fileName = useRef() as React.MutableRefObject<HTMLInputElement>;
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const next = useSelector((state: RootState) => state.fileService.nextEntries);
  const isLoading = useSelector((state: RootState) => state.fileService.isLoading);
  const coreFileTypes = useSelector((state: RootState) => state.fileService.coreFileTypes);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const criteria: Criteria = {};
  if (searchName.length > 0) {
    criteria.filenameContains = searchName;
  }
  if (filterFileType) {
    criteria.typeEquals = filterFileType;
  }

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
    fileName.current.value = '';
  };

  const onChange = (event) => {
    setSelectFile(event.target.files[0]);
  };

  const onNext = () => {
    dispatch(FetchFilesService(next, criteria));
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

  interface Criteria {
    filenameContains?: string;
    typeEquals?: string;
  }

  const getFilteredFiles = () => {
    dispatch(FetchFilesService(null, criteria));
  };

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const renderFileTable = () => {
    return (
      <FileTableStyles>
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
            {fileList.map((file, key) => {
              return (
                <tr key={key}>
                  <td>{file.filename}</td>
                  {/* Use ceil here to make sure people will allocate enough resouces */}
                  <td>{Math.ceil(file.size / 1024)}</td>
                  <td>{file.typeName}</td>
                  <td>
                    <div className="flex-horizontal">
                      <div className="flex">
                        <GoAIconButton
                          data-testid="download-icon"
                          size="medium"
                          type="download"
                          onClick={() => onDownloadFile(file)}
                        />
                      </div>
                      <div className="flex">
                        <GoAIconButton
                          data-testid="delete-icon"
                          size="medium"
                          type="trash"
                          onClick={() => onDeleteFile(file)}
                        />
                      </div>
                    </div>
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
      </FileTableStyles>
    );
  };
  return (
    <>
      <GoAForm>
        <UploadHeading>Please upload a file</UploadHeading>
        <input type="file" onChange={onChange} aria-label="file upload" ref={fileName} />
        <FileTypeDropdown>
          <GoADropdown
            name="fileType"
            selectedValues={uploadFileType}
            multiSelect={false}
            onChange={(name, values) => {
              setUploadFileType(values);
            }}
          >
            {getFileTypesValues().map((item, key) => (
              <GoADropdownOption label={item.name} value={item.id} key={key} data-testid={item.id} />
            ))}
          </GoADropdown>
        </FileTypeDropdown>

        <GoAButton type="submit" disabled={!(selectedFile && uploadFileType.length > 0)} onClick={onUploadSubmit}>
          Upload
        </GoAButton>
      </GoAForm>
      <hr />

      <GoAForm>
        <GoAFlexRow gap="small">
          <GoAFormItem>
            <label htmlFor="name">File Name Search</label>
            <GoAInputText name="name" id="name" value={searchName} onChange={(_, value) => setSearchName(value)} />
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="name">File Type Filter</label>

            <GoADropdown
              name="fileType"
              selectedValues={[filterFileType]}
              multiSelect={false}
              onChange={(name, values) => {
                setFilterFileType(values[0]);
              }}
            >
              {getFileTypesValues().map((item, key) => (
                <GoADropdownOption label={item.name} value={item.id} key={key} data-testid={item.id} />
              ))}
            </GoADropdown>
          </GoAFormItem>
        </GoAFlexRow>
        <GoAFormActions alignment="right">
          <GoAButton
            buttonType="secondary"
            title="Reset"
            onClick={() => {
              setSearchName('');
              setFilterFileType(null);
              dispatch(FetchFilesService(null));
            }}
          >
            Reset
          </GoAButton>
          <GoAButton title="Search" onClick={getFilteredFiles}>
            Search
          </GoAButton>
        </GoAFormActions>
      </GoAForm>
      <br />
      {!indicator.show && fileList?.length === 0 && renderNoItem('file')}
      {(!indicator.show || fileList?.length > 0) && renderFileTable()}
      {indicator.show && <PageIndicator />}
      {next && (
        <GoAButton disabled={isLoading} onClick={onNext}>
          Load more...
        </GoAButton>
      )}
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

const FileTableStyles = styled.div`
  .flex-horizontal {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }
`;
