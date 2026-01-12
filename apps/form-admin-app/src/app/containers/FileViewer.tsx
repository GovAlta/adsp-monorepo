import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  AppDispatch,
  AppState,
  downloadFile,
  fileDataUrlSelector,
  fileLoadingSelector,
  fileMetadataSelector,
} from '../state';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { GoabDivider } from '@abgov/react-components';

interface FileViewerProps {
  className?: string;
  urn: string;
}

const FileViewerComponent: FunctionComponent<FileViewerProps> = ({ className, urn }) => {
  const metadata = useSelector((state: AppState) => fileMetadataSelector(state, urn));
  const fileDataUrl = useSelector((state: AppState) => fileDataUrlSelector(state, urn));
  const isLoading = useSelector((state: AppState) => fileLoadingSelector(state, urn));

  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (!fileDataUrl) {
      dispatch(downloadFile(urn));
    }
  }, [dispatch, fileDataUrl, urn]);

  return (
    <div className={className}>
      <LoadingIndicator isLoading={isLoading} />
      {metadata && (
        <object type={metadata.mimeType} name={metadata.filename} aria-label={metadata.filename} data={fileDataUrl} />
      )}
      <div>
        <GoabDivider mb="m" />
        <span>File Name: {metadata?.filename}</span>
      </div>
    </div>
  );
};

export const FileViewer = styled(FileViewerComponent)`
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: stretch;
  justify-items: flex-end;
  & > object {
    flex: 1;
  }
  & > div:last-child {
    flex: 0;
  }
`;

export default FileViewer;
