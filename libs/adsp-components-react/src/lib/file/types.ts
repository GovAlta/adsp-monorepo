import type { ReactElement } from 'react';
import type { AdspComponentThemeOverrides, IFileClient } from '@abgov/adsp-components-core';

/** Props the component sets on a custom trigger; a GoabButton or a native button or link accepts them. */
export interface AdspFileDownloadTriggerProps {
  onClick?: (event?: { preventDefault?: () => void }) => void;
  disabled?: boolean;
}

export interface AdspFileDownloadProps {
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
  children?: ReactElement<AdspFileDownloadTriggerProps>;
  themeOverrides?: AdspComponentThemeOverrides<'fileDownload'>;
  testId?: string;
}
