import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  GoabButton,
  GoabContainer,
  GoabDetails,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabTab,
  GoabTable,
  GoabTabs,
  GoabText,
} from '@abgov/react-components';
import { FileClient } from '@abgov/adsp-components-core';
import { AdspFileClientProvider, GoAFileDownload } from '@abgov/adsp-components-react';
import { directorySelector, getAccessToken } from '../../../state';
import { ServiceContainer } from '../../styled-components';
import { AdspFileDownloadSideBySide, MISSING_FILE_ID } from './AdspFileDownloadSideBySide';

export { MISSING_FILE_ID };

const FILE_SERVICE_ID = 'urn:ads:platform:file-service';

interface ListedFile {
  id: string;
  filename: string;
  typeName?: string;
}

const APPLICATION_SETUP = `import { useMemo } from 'react';
import { FileClient } from '@abgov/adsp-components-core';
import { AdspFileClientProvider } from '@abgov/adsp-components-react';

// Once, near the top of the app. Create the client once: a new client reloads every file.
const client = useMemo(
  () => new FileClient({ serviceUrl: fileServiceUrl, getAccessToken }),
  [fileServiceUrl],
);

<AdspFileClientProvider client={client}>
  <App />
</AdspFileClientProvider>`;

const DEFAULT_USAGE = `<GoAFileDownload fileId={file.id} />`;

const CUSTOM_TRIGGER_USAGE = `<GoAFileDownload fileId={file.id}>
  <GoabButton type="secondary" leadingIcon="download">
    Download
  </GoabButton>
</GoAFileDownload>`;

const LIST_USAGE = `{files.map((file) => (
  <tr key={file.id}>
    <td>{file.filename}</td>
    <td>
      <GoAFileDownload fileId={file.id}>
        <GoabButton type="tertiary" size="compact">Download</GoabButton>
      </GoAFileDownload>
    </td>
  </tr>
))}`;

const MISSING_USAGE = `<GoAFileDownload fileId="${MISSING_FILE_ID}" />`;

const NO_PERMISSION_USAGE = `// The application decides the user can't download; nothing renders and nothing is requested.
<GoAFileDownload fileId={file.id} canDownload={false} />`;

const Example = ({
  heading,
  description,
  code,
  children,
}: {
  heading: string;
  description: string;
  code: string;
  children: React.ReactNode;
}) => (
  <>
    <GoabText size="heading-s" mt="xl">
      {heading}
    </GoabText>
    <GoabText size="body-m">{description}</GoabText>
    {children}
    <GoabDetails heading="Code" mt="m">
      <pre>{code}</pre>
    </GoabDetails>
  </>
);

export const AdspFileDownloadExample = () => {
  const directory = useSelector(directorySelector);
  const fileServiceUrl = directory?.[FILE_SERVICE_ID];

  const client = useMemo(
    () => (fileServiceUrl ? new FileClient({ serviceUrl: fileServiceUrl, getAccessToken }) : null),
    [fileServiceUrl],
  );

  const [files, setFiles] = useState<ListedFile[]>([]);
  const [listError, setListError] = useState<string>();
  const [selectedFileId, setSelectedFileId] = useState('');
  const [enteredFileId, setEnteredFileId] = useState('');

  const loadFiles = async () => {
    if (!fileServiceUrl) {
      return;
    }

    try {
      setListError(undefined);
      const token = await getAccessToken();
      const url = new URL('/file/v1/files', fileServiceUrl);
      url.searchParams.set('top', '20');
      const response = await fetch(url.href, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        throw new Error(`Unable to load files (${response.status}).`);
      }

      const { results = [] } = (await response.json()) as { results?: ListedFile[] };
      setFiles(results);
      setSelectedFileId((current) => current || results[0]?.id || '');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Unable to load files.');
    }
  };

  useEffect(() => {
    void loadFiles();
    // Load once the File service URL is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileServiceUrl]);

  const exampleFileId = enteredFileId.trim() || selectedFileId;

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="adsp-file-download-container"
        heading="ADSP file download"
      >
        <GoabText size="body-m" mt="none">
          GoAFileDownload downloads a File service file. It uses the application's sign-in, shows progress, and explains
          missing files, permission failures and pending virus scans. File service still authorizes every download.
        </GoabText>

        {!client ? (
          <GoabText size="body-m" data-testid="file-service-unavailable">
            The File service URL isn't available from the directory yet.
          </GoabText>
        ) : (
          <AdspFileClientProvider client={client}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
              <GoabFormItem label="Tenant file" labelSize="compact" helpText="Files you can read in this tenant.">
                <GoabDropdown
                  name="adsp-file-download-file"
                  value={selectedFileId}
                  width="100%"
                  size="compact"
                  disabled={files.length === 0}
                  onChange={(detail) => setSelectedFileId(detail.value)}
                >
                  {files.map((file) => (
                    <GoabDropdownItem
                      key={file.id}
                      value={file.id}
                      label={file.typeName ? `${file.filename} (${file.typeName})` : file.filename}
                    />
                  ))}
                </GoabDropdown>
              </GoabFormItem>
              <GoabFormItem
                label="Or a file ID"
                labelSize="compact"
                helpText="Try a file of a type you can't read, or one still being scanned."
              >
                <GoabInput
                  name="adsp-file-download-file-id"
                  value={enteredFileId}
                  width="100%"
                  size="compact"
                  testId="adsp-file-download-file-id"
                  onChange={(detail) => setEnteredFileId(detail.value)}
                />
              </GoabFormItem>
            </div>

            <GoabButton type="secondary" size="compact" mt="s" onClick={() => void loadFiles()}>
              Reload files
            </GoabButton>
            {listError && <GoabText size="body-s">{listError}</GoabText>}
            {!listError && files.length === 0 && (
              <GoabText size="body-s">
                No files found. Upload one in File service to try the examples, or enter a file ID.
              </GoabText>
            )}

            <GoabTabs initialTab={1} navigation="none" testId="adsp-file-download-tabs">
              <GoabTab heading="Showcase">
                {exampleFileId && (
                  <>
                    <Example
                      heading="Default"
                      description="Only the file ID: the component shows the filename and size from File service."
                      code={DEFAULT_USAGE}
                    >
                      <GoAFileDownload fileId={exampleFileId} testId="example-default" />
                    </Example>

                    <Example
                      heading="Your own trigger"
                      description="Pass any button or link as the child. The component handles the download; the file isn't looked up until it's clicked."
                      code={CUSTOM_TRIGGER_USAGE}
                    >
                      <GoAFileDownload fileId={exampleFileId} testId="example-custom">
                        <GoabButton type="secondary" leadingIcon="download">
                          Download
                        </GoabButton>
                      </GoAFileDownload>
                    </Example>
                  </>
                )}

                {files.length > 0 && (
                  <Example
                    heading="In a file list"
                    description="A download action per row, without a metadata request per row."
                    code={LIST_USAGE}
                  >
                    <GoabTable width="100%" mt="m" testId="example-list">
                      <thead>
                        <tr>
                          <th>File</th>
                          <th>Type</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.id}>
                            <td>{file.filename}</td>
                            <td>{file.typeName}</td>
                            <td>
                              <GoAFileDownload fileId={file.id}>
                                <GoabButton type="tertiary" size="compact">
                                  Download
                                </GoabButton>
                              </GoAFileDownload>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </GoabTable>
                  </Example>
                )}

                <Example
                  heading="Missing file"
                  description="File service answers 404, so the component says the file doesn't exist."
                  code={MISSING_USAGE}
                >
                  <GoAFileDownload fileId={MISSING_FILE_ID} testId="example-missing" />
                </Example>

                <Example
                  heading="Download not permitted by the application"
                  description="With canDownload={false} the component renders nothing, so there is nothing to see here. A user File service refuses sees a permission message instead: enter the ID of a file whose type you can't read."
                  code={NO_PERMISSION_USAGE}
                >
                  <GoAFileDownload
                    fileId={exampleFileId || MISSING_FILE_ID}
                    canDownload={false}
                    testId="example-denied"
                  />
                </Example>

                <GoabDetails heading="Application setup" mt="xl">
                  <pre>{APPLICATION_SETUP}</pre>
                </GoabDetails>
              </GoabTab>
              <GoabTab heading="Side by side">
                <AdspFileDownloadSideBySide fileId={exampleFileId} files={files} />
              </GoabTab>
            </GoabTabs>
          </AdspFileClientProvider>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};

export default AdspFileDownloadExample;
