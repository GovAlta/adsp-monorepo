import React, { useCallback, useState } from 'react';
import { GoabText } from '@abgov/react-components';
import type { FileMetadata, IFileClient, IFileUploadClient } from '@abgov/adsp-components-core';
import { ADSPFileDownload, ADSPFileUpload } from '@abgov/adsp-components-react';

// No File Type has this ID, so File service answers 404.
export const SIDE_BY_SIDE_MISSING_FILE_TYPE_ID = 'adsp-sandbox-missing-file-type';
export const SIDE_BY_SIDE_RECORD_ID = 'adsp-sandbox-upload-example';

interface AdspFileUploadSideBySideProps {
  client: IFileUploadClient & IFileClient;
  /** The File Type the examples upload to; empty until one is picked. */
  fileTypeId: string;
}

const MINIMAL_CODE = `import { useMemo } from 'react';
import { FileClient } from '@abgov/adsp-components-core';
import { ADSPFileUpload } from '@abgov/adsp-components-react';

// fileServiceUrl: from the ADSP directory (urn:ads:platform:file-service)
//   Development: https://file-service.adsp-dev.gov.ab.ca
//   UAT:         https://file-service.adsp-uat.alberta.ca
//   Production:  https://file-service.adsp.alberta.ca
// getAccessToken: your app's sign-in, returning the user's token
// "my-file-type": a File Type configured in your tenant's File service
function SupportingDocumentUpload() {
  const client = useMemo(
    () => new FileClient({ serviceUrl: fileServiceUrl, getAccessToken }),
    [fileServiceUrl],
  );

  return <ADSPFileUpload client={client} fileTypeId="my-file-type" />;
}`;

const RECORD_CODE = `import { useState } from 'react';
import { ADSPFileUpload } from '@abgov/adsp-components-react';

// recordId: the record in your app the files belong to, such as an application
const [files, setFiles] = useState([]);

<ADSPFileUpload
  client={client}
  fileTypeId="my-file-type"
  recordId={application.id}
  onUpload={(file) => setFiles((current) => [...current, file])}
/>
<ul>
  {files.map((file) => (
    <li key={file.id}>{file.filename}</li>
  ))}
</ul>`;

const UPLOAD_THEN_DOWNLOAD_CODE = `import { useState } from 'react';
import { ADSPFileDownload, ADSPFileUpload } from '@abgov/adsp-components-react';

// The same client uploads and downloads.
const [uploaded, setUploaded] = useState(null);

<ADSPFileUpload client={client} fileTypeId="my-file-type" onUpload={setUploaded} />
{uploaded && <ADSPFileDownload client={client} fileId={uploaded.id} />}`;

const THEMED_CODE = `import { ADSPFileUpload } from '@abgov/adsp-components-react';

const uploadTheme = {
  successTextColor: 'var(--adsp-color-interactive-default)',
  errorTextColor: 'var(--adsp-color-status-important)',
};

<ADSPFileUpload client={client} fileTypeId="my-file-type" themeOverrides={uploadTheme} />
<ADSPFileUpload client={client} fileTypeId={missingFileTypeId} themeOverrides={uploadTheme} />`;

// Defined once so the override object keeps its identity across renders.
const UPLOAD_THEME = {
  successTextColor: 'var(--adsp-color-interactive-default)',
  errorTextColor: 'var(--adsp-color-status-important)',
};

const SideBySide = ({
  heading,
  description,
  code,
  testId,
  children,
}: {
  heading: string;
  description: string;
  code: string;
  testId: string;
  children: React.ReactNode;
}) => (
  <section data-testid={testId}>
    <GoabText size="heading-s" mt="xl">
      {heading}
    </GoabText>
    <GoabText size="body-m">{description}</GoabText>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      <div>
        <GoabText size="heading-xs" mt="none">
          Result
        </GoabText>
        {children}
      </div>
      <div style={{ minWidth: 0 }}>
        <GoabText size="heading-xs" mt="none">
          Code
        </GoabText>
        <pre style={{ margin: 0, overflowX: 'auto' }}>{code}</pre>
      </div>
    </div>
  </section>
);

const PickAFileType = () => <GoabText size="body-s">Pick a file type above to see this example.</GoabText>;

export const AdspFileUploadSideBySide = ({ client, fileTypeId }: AdspFileUploadSideBySideProps) => {
  const [recordFiles, setRecordFiles] = useState<FileMetadata[]>([]);
  const [uploaded, setUploaded] = useState<FileMetadata | null>(null);
  const addRecordFile = useCallback((file: FileMetadata) => setRecordFiles((current) => [...current, file]), []);

  return (
    <>
      <GoabText size="body-m" mt="m">
        Each example shows the component on the left and the code for it on the right. Examples 2 to 4 use the client
        created in example 1. Uploads are real: they go to the file type picked above.
      </GoabText>

      <SideBySide
        heading="1. Minimal: a client and a file type"
        description="Create a File service client with your app's sign-in, then pass it with the File Type ID. Drop a file or choose one to upload it."
        code={MINIMAL_CODE}
        testId="side-by-side-minimal"
      >
        {fileTypeId ? (
          <ADSPFileUpload client={client} fileTypeId={fileTypeId} testId="side-by-side-minimal-upload" />
        ) : (
          <PickAFileType />
        )}
      </SideBySide>

      <SideBySide
        heading="2. Linked to a record"
        description="recordId ties each upload to a record in your app. onUpload hands back each stored file, so you can list them."
        code={RECORD_CODE}
        testId="side-by-side-record"
      >
        {fileTypeId ? (
          <>
            <ADSPFileUpload
              client={client}
              fileTypeId={fileTypeId}
              recordId={SIDE_BY_SIDE_RECORD_ID}
              onUpload={addRecordFile}
              testId="side-by-side-record-upload"
            />
            {recordFiles.length > 0 && (
              <ul data-testid="side-by-side-record-files">
                {recordFiles.map((file) => (
                  <li key={file.id}>{file.filename}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <PickAFileType />
        )}
      </SideBySide>

      <SideBySide
        heading="3. Upload, then download"
        description="The same client works for ADSPFileDownload, so the file can be downloaded as soon as it's stored. A new upload's virus scan may still be pending."
        code={UPLOAD_THEN_DOWNLOAD_CODE}
        testId="side-by-side-upload-download"
      >
        {fileTypeId ? (
          <>
            <ADSPFileUpload
              client={client}
              fileTypeId={fileTypeId}
              onUpload={setUploaded}
              testId="side-by-side-upload-download-upload"
            />
            {uploaded && (
              <div style={{ marginTop: '1rem' }}>
                <ADSPFileDownload client={client} fileId={uploaded.id} testId="side-by-side-upload-download-download" />
              </div>
            )}
          </>
        ) : (
          <PickAFileType />
        )}
      </SideBySide>

      <SideBySide
        heading="4. Themed"
        description="themeOverrides changes the component's own text: progress, confirmation and error messages. The GoA drop area and file card keep the GoA look."
        code={THEMED_CODE}
        testId="side-by-side-themed"
      >
        {fileTypeId ? (
          <ADSPFileUpload
            client={client}
            fileTypeId={fileTypeId}
            themeOverrides={UPLOAD_THEME}
            testId="side-by-side-themed-upload"
          />
        ) : (
          <PickAFileType />
        )}
        <div style={{ marginTop: '1rem' }}>
          <ADSPFileUpload
            client={client}
            fileTypeId={SIDE_BY_SIDE_MISSING_FILE_TYPE_ID}
            themeOverrides={UPLOAD_THEME}
            testId="side-by-side-themed-missing"
          />
        </div>
      </SideBySide>
    </>
  );
};

export default AdspFileUploadSideBySide;
