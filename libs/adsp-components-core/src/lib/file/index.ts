// clean-code-ignore: RULE-19 (barrel file; each export is tested where it is defined)
export { FileClient } from './fileClient';
export type { FileClientOptions } from './fileClient';
export { FileServiceError, getFileUnavailableReason, toFileServiceError } from './fileServiceError';
export { formatAllowedFileTypes, formatFileSize, isFileFormatAllowed } from './format';
export { getFileErrorMessage, getFileUploadErrorMessage } from './messages'; // clean-code-ignore: RULE-19 (barrel export; each export is tested where it is defined)
export type { AdspFileDownloadTheme } from './fileDownloadTheme';
export type { AdspFileUploadTheme } from './fileUploadTheme';
export type {
  DownloadedFile,
  FileMetadata,
  FileServiceErrorReason,
  FileTypeInfo,
  IFileClient,
  IFileUploadClient,
  UploadFileOptions,
} from './types';
