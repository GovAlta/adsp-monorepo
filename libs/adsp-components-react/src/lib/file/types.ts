// clean-code-ignore: RULE-19 (types only; no runtime code to test)
import type { ReactElement } from 'react';
import type {
  AdspComponentThemeOverrides,
  FileMetadata,
  IFileClient,
  IFileUploadClient,
} from '@abgov/adsp-components-core';

/**
 * Props the component sets on a custom trigger; a GoabButton or a native button or link accepts them.
 * A link can't be disabled, so a link trigger gets aria-disabled instead and its clicks are ignored while disabled.
 */
export interface ADSPFileDownloadTriggerProps {
  onClick?: (event?: { preventDefault?: () => void }) => void;
  disabled?: boolean;
  'aria-disabled'?: boolean;
}

export interface ADSPFileDownloadProps {
  /** ID of the File service file to download. */
  fileId: string;
  /** Loads and downloads the file, usually a FileClient from core. Create it once or memoize it. */
  client: IFileClient;
  /**
   * Whether the application allows the current user to download files. False renders nothing and sends no request.
   * File service still authorizes every request, so true only means "try".
   */
  canDownload?: boolean;
  /**
   * A custom trigger, such as `<GoabButton type="secondary">Download</GoabButton>`, in place of the default control.
   * The component sets its onClick, and disabled while a download runs. File metadata isn't loaded up front.
   */
  children?: ReactElement<ADSPFileDownloadTriggerProps>;
  themeOverrides?: AdspComponentThemeOverrides<'fileDownload'>;
  testId?: string;
}

export interface ADSPFileUploadProps {
  /** ID of the File service File Type the files are uploaded as. */
  fileTypeId: string;
  /** Loads the File Type and uploads files, usually a FileClient from core. Create it once or memoize it. */
  client: IFileUploadClient;
  /**
   * Whether the application allows the current user to upload files. False renders nothing and sends no request.
   * File service still authorizes every request, so true only means "try".
   */
  canUpload?: boolean;
  /** Associates uploaded files with a record in the application, such as a form submission. */
  recordId?: string;
  /** Called with the file as File service stored it, once an upload succeeds. */
  onUpload?: (file: FileMetadata) => void;
  themeOverrides?: AdspComponentThemeOverrides<'fileUpload'>;
  testId?: string;
}
