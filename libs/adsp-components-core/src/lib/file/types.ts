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
 * - `unexpected`: a server or network failure; trying again can succeed
 */
export type FileServiceErrorReason =
  | 'not-found'
  | 'unauthenticated'
  | 'forbidden'
  | 'scan-pending'
  | 'unavailable'
  | 'unexpected';

export interface IFileClient {
  getFile(fileId: string): Promise<FileMetadata>;
  downloadFile(fileId: string): Promise<DownloadedFile>;
}
