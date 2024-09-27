import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UploadFileService,
  FetchFilesService,
  DeleteFileService,
  DownloadFileService,
  FetchFileTypeService,
} from '@store/file/actions';
import {
  GoADropdownItem,
  GoADropdown,
  GoAButton,
  GoAFileUploadInput,
  GoAFileUploadCard,
  GoAFormItem,
  GoAButtonGroup,
  GoAInput,
} from '@abgov/react-components-new';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { DeleteModal } from '@components/DeleteModal';
import { FileItem } from '@store/file/models';
import { PageIndicator } from '@components/Indicator';
import styled from 'styled-components';
import { selectActionStateStart, selectActionStateCompleted } from '@store/session/selectors';
import { UPLOAD_FILE } from '@store/file/actions';
import { LoadMoreWrapper } from '@components/styled-components';
import { NoPaddingH2 } from '@components/AppHeader';

const FileList = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileForDeletion, setSelectedFileForDeletion] = useState<FileItem | null>(null);
  const [uploadFileType, setUploadFileType] = useState<string>('');
  const [filterFileType, setFilterFileType] = useState<string>('');
  const [resetFilter, setResetFilter] = useState<string>('visible');
  const [searchName, setSearchName] = useState<string>('');
  const dispatch = useDispatch();
  const fileList = useSelector((state: RootState) => state.fileService.fileList);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const next = useSelector((state: RootState) => state.fileService.nextEntries);
  const isLoading = useSelector((state: RootState) => state.fileService.isLoading);
  const coreFileTypes = useSelector((state: RootState) => state.fileService.coreFileTypes);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  interface Criteria {
    filenameContains?: string;
    typeEquals?: string;
  }

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

  const isUploadingFile = useSelector(selectActionStateStart(UPLOAD_FILE));
  const hasUploadingFileCompleted = useSelector(selectActionStateCompleted(UPLOAD_FILE));

  const onUploadSubmit = () => {
    if (!selectedFile || !uploadFileType) return;
    const fileInfo = { file: selectedFile, type: uploadFileType };
    dispatch(UploadFileService(fileInfo));
    setSelectedFile(null);
  };

  const uploadFile = (file: File) => {
    setSelectedFile(file);
    setProgress({ [file.name]: 0 });

    const reader = new FileReader();
    reader.onloadstart = () => {
      setProgress({ [file.name]: 20 });
    };
    reader.onload = () => {
      setProgress({ [file.name]: 100 });
    };
    reader.readAsText(file);
  };

  const deleteFile = () => {
    setSelectedFile(null);
    setProgress({});
  };

  const onNext = () => {
    dispatch(FetchFilesService(next, criteria));
  };

  const onDownloadFile = async (file) => {
    dispatch(DownloadFileService(file));
  };

  const onDeleteFile = (file) => {
    setSelectedFileForDeletion(file);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteFile = () => {
    if (selectedFileForDeletion) {
      dispatch(DeleteFileService(selectedFileForDeletion.id));
      setShowDeleteConfirmation(false);
      setSelectedFileForDeletion(null);
    }
  };

  useEffect(() => {
    dispatch(FetchFilesService());
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  const getFilteredFiles = () => {
    dispatch(FetchFilesService(null, criteria));
  };

  const renderFileTable = () => {
    return (
      <FileTableStyles>
        <DataTable id="files-information">
          <thead>
            <tr>
              <th>File name</th>
              <th>Size (KB)</th>
              <th>Type</th>
              <th>File ID</th>
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
                  <td>{file.id}</td>
                  <td>
                    <GoAContextMenu>
                      <GoAContextMenuIcon
                        testId="download-icon"
                        title="Download"
                        type="download"
                        onClick={() => onDownloadFile(file)}
                      />

                      <GoAContextMenuIcon
                        data-testid="delete-icon"
                        title="Delete"
                        type="trash"
                        onClick={() => onDeleteFile(file)}
                      />
                    </GoAContextMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>

        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete file"
          content={
            <div>
              Are you sure you wish to delete <b>{selectedFileForDeletion?.filename}</b>?
            </div>
          }
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={confirmDeleteFile}
        />
      </FileTableStyles>
    );
  };

  return (
    <FileTable>
      <NoPaddingH2>Please upload a file</NoPaddingH2>

      <GoAFormItem label="Upload a file">
        <GoAFileUploadInput onSelectFile={uploadFile} variant="button" maxFileSize="100MB" />
        {selectedFile && (
          <GoAFileUploadCard
            data-testid="import-input"
            filename={selectedFile.name}
            type={selectedFile.type}
            size={selectedFile.size}
            progress={progress[selectedFile.name]}
            onDelete={deleteFile}
            onCancel={deleteFile}
          />
        )}
      </GoAFormItem>
      <FileTypeDropdown>
        <GoAFormItem label="Select a file type">
          <GoADropdown
            name="fileType"
            value={uploadFileType}
            width="100%"
            testId="file-type-name-dropdown-1"
            onChange={(name, values: string | string[]) => setUploadFileType(values.toString())}
          >
            {getFileTypesValues().map((item, key) => (
              <GoADropdownItem label={item.name} value={item.id} key={key} testId={item.id} />
            ))}
          </GoADropdown>
        </GoAFormItem>
      </FileTypeDropdown>

      <GoAButton
        type="submit"
        onClick={onUploadSubmit}
        disabled={isUploadingFile || !(selectedFile && uploadFileType.length > 0)}
      >
        Upload
      </GoAButton>

      <div className="mt-48">
        <NoPaddingH2>File filtering</NoPaddingH2>
        <GoAFormItem label="Search file name">
          <GoAInput
            type="text"
            name="name"
            id="name"
            value={searchName}
            testId="file-type-name-input"
            width="100%"
            onChange={(_, value) => setSearchName(value)}
          />
        </GoAFormItem>
        <GoAFormItem label="Filter file type">
          {resetFilter === 'visible' && (
            <GoADropdown
              name="fileType"
              value={filterFileType}
              width="100%"
              testId="file-type-name-dropdown-2"
              onChange={(name, value: string | string[]) => setFilterFileType(value.toString())}
            >
              {getFileTypesValues().map((item, key) => (
                <GoADropdownItem label={item.name} value={item.id} key={key} testId={item.id} />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
        <br />
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            onClick={() => {
              setSearchName('');
              setFilterFileType('');
              setResetFilter('switch');
              dispatch(FetchFilesService(null));
            }}
          >
            Reset
          </GoAButton>

          <GoAButton onClick={getFilteredFiles}>Search</GoAButton>
        </GoAButtonGroup>
      </div>
      <br />
      {!isLoading && !fileList?.length && renderNoItem('file')}
      {!isLoading && fileList?.length > 0 && renderFileTable()}
      {isLoading && <PageIndicator />}
      {next && (
        <LoadMoreWrapper>
          <GoAButton type="tertiary" disabled={isLoading} onClick={onNext}>
            Load more
          </GoAButton>
        </LoadMoreWrapper>
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
  padding: 1rem 0;
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
