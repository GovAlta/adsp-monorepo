// clean-code-ignore: RULE-19 (types only; no runtime code to test)
export interface FileMetadata {
  id: string;
  urn: string;
  filename: string;
  /** Size in bytes. */
  size: number;
  mimeType?: string;
  typeName?: string;
  recordId?: string;
  created?: Date;
  /** False while the virus scan is pending; File service refuses to download the file until it is true. */
  scanned: boolean;
  infected: boolean;
}

export interface DownloadedFile {
  blob: Blob;
  /** Name File service gives the file in its Content-Disposition header. */
  filename: string;
  mimeType: string;
}

/**
 * Why File service didn't return a file, in terms a component can act on:
 * - `not-found`: no file with that ID
 * - `unauthenticated`: the user isn't signed in and the file type doesn't allow anonymous read
 * - `forbidden`: the user isn't permitted to read the file
 * - `scan-pending`: the virus scan hasn't finished; trying again later can succeed
 * - `unavailable`: the file is infected, marked for deletion, or the request was rejected as invalid
 * - `unsupported-format`: the file's format isn't one the File Type allows; trying again can't succeed
 * - `unexpected`: a server or network failure; trying again can succeed
 */
export type FileServiceErrorReason =
  | 'not-found'
  | 'unauthenticated'
  | 'forbidden'
  | 'scan-pending'
  | 'unavailable'
  | 'unsupported-format'
  | 'unexpected';

export interface FileTypeInfo { // clean-code-ignore: RULE-19 (types only; no runtime code to test)
  id: string;
  name: string;
  anonymousRead: boolean;
  /** Extensions the File Type accepts, such as `.pdf`; empty when it accepts any format. */
  allowedFileTypes: string[];
}

export interface UploadFileOptions {
  /** Associates the file with a record in the application, such as a form submission. */
  recordId?: string;
  /** Called as the content is sent, with the fraction sent from 0 to 1. */
  onProgress?: (fraction: number) => void;
  /** Aborting it cancels the upload, which then rejects with an AbortError. */
  signal?: AbortSignal;
}

export interface IFileUploadClient {
  /** The File Type's configuration, which also confirms that the user may use it. */
  getFileType(fileTypeId: string): Promise<FileTypeInfo>;
  uploadFile(fileTypeId: string, file: File, options?: UploadFileOptions): Promise<FileMetadata>;
}

export interface IFileClient {
  getFile(fileId: string): Promise<FileMetadata>;
  downloadFile(fileId: string): Promise<DownloadedFile>;
}
