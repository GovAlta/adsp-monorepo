import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadFileService,
  FetchFileTypeService,
  FetchFilesService,
  DeleteFileService,
  DownloadFileService,
} from '@store/file/actions';
//import { GoADropdownOption } from '@abgov/react-components';
import { GoAButton } from '@abgov/react-components-new';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { GoAIconButton, GoAForm, GoAFormActions } from '@abgov/react-components/experimental';
import { GoAInput, GoAFormItem, GoADropdown, GoADropdownOption } from '@abgov/react-components-new';
import { renderNoItem } from '@components/NoItem';
import { DeleteModal } from '@components/DeleteModal';
import { FileItem } from '@store/file/models';
import { PageIndicator } from '@components/Indicator';

import styled from 'styled-components';

const FileList = (): JSX.Element => {
  const [selectedFile, setSelectFile] = useState<FileItem>(null);
  const [uploadFileType, setUploadFileType] = useState<string>('');
  const [filterFileType, setFilterFileType] = useState<string>('');
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

  const onUploadSubmit = () => {
    const fileInfo = { file: selectedFile, type: uploadFileType };
    dispatch(UploadFileService(fileInfo));
    setUploadFileType('');
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
              <th>File name</th>
              <th>Size (KB)</th>
              <th>Type</th>
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
    <FileTable>
      <GoAForm>
        <h2>Please upload a file</h2>
        <>
          <input
            id="file-uploads"
            name="inputFile"
            type="file"
            onChange={onChange}
            aria-label="file upload"
            ref={fileName}
            data-testid="import-input"
            style={{ display: 'none' }}
            onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
              const element = event.target as HTMLInputElement;
              element.value = '';
            }}
          />
          <div className="row-flex">
            <button className="choose-button" data-testid="file-input-button" onClick={() => fileName.current.click()}>
              {' Choose a file'}
            </button>

            <div className="margin-left">
              {fileName?.current?.value ? fileName.current.value.split('\\').pop() : 'No file was chosen'}
            </div>
          </div>
        </>
        <FileTypeDropdown>
          <GoAFormItem label="Select a file type">
            <GoADropdown
              name="fileType"
              value={uploadFileType}
              width="100%"
              onChange={(name, values: string | string[]) => {
                setUploadFileType(values.toString());
              }}
            >
              {getFileTypesValues().map((item, key) => (
                <GoADropdownOption label={item.name} value={item.id} key={key} data-testid={item.id} />
              ))}
            </GoADropdown>
          </GoAFormItem>
        </FileTypeDropdown>

        <GoAButton type="submit" onClick={onUploadSubmit} disabled={!(selectedFile && uploadFileType.length > 0)}>
          Upload
        </GoAButton>
      </GoAForm>

      <div className="mt-48">
        <GoAForm>
          <h2>File filtering</h2>

          <GoAFormItem label="Search file name">
            <GoAInput
              type="text"
              name="name"
              id="name"
              value={searchName}
              width="100%"
              onChange={(_, value) => setSearchName(value)}
            />
          </GoAFormItem>

          <GoAFormItem label="Filter file type">
            <GoADropdown
              name="fileType"
              value={filterFileType}
              width="100%"
              onChange={(name, value: string | string[]) => {
                setFilterFileType(value.toString());
              }}
            >
              {getFileTypesValues().map((item, key) => (
                <GoADropdownOption label={item.name} value={item.id} key={key} data-testid={item.id} />
              ))}
            </GoADropdown>
          </GoAFormItem>
          <GoAFormActions alignment="right">
            <GoaButtonPadding>
              <GoAButton
                type="secondary"
                onClick={() => {
                  setSearchName('');
                  setFilterFileType(null);
                  dispatch(FetchFilesService(null));
                }}
              >
                Reset
              </GoAButton>
            </GoaButtonPadding>
            <GoAButton onClick={getFilteredFiles}>Search</GoAButton>
          </GoAFormActions>
        </GoAForm>
      </div>
      <br />
      {!indicator.show && fileList?.length === 0 && renderNoItem('file')}
      {!indicator.show && fileList?.length > 0 && renderFileTable()}
      {indicator.show && <PageIndicator />}
      {next && (
        <GoAButton disabled={isLoading} onClick={onNext}>
          Load more...
        </GoAButton>
      )}
    </FileTable>
  );
};

export default FileList;

const FileTypeDropdown = styled.div`
  margin-bottom: 1rem;
  margin-top: 1rem;
  width: 100%;
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

const FileTable = styled.div`
  .mt-48 {
    margin-top: 48px;
  }

  .choose-button {
    border-radius: 4px;
    background: #f1f1f1;
  }

  .dropdown-label {
    font-weight: bold;
    line-height: 34px;
  }

  .margin-left {
    margin-left: 0.5rem;
    margin-top: 0.25rem;
  }

  .row-flex {
    display: flex;
  }
`;

const GoaButtonPadding = styled.div`
  margin-right: 16px;
`;
