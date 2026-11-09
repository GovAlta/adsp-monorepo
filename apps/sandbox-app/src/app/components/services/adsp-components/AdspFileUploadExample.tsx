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
import { FileClient, type FileMetadata } from '@abgov/adsp-components-core';
import { ADSPFileUpload } from '@abgov/adsp-components-react';
import { directorySelector, getAccessToken } from '../../../state';
import { ServiceContainer } from '../../styled-components';
import { AdspFileUploadSideBySide } from './AdspFileUploadSideBySide';

const FILE_SERVICE_ID = 'urn:ads:platform:file-service';

// No File Type has this ID, so File service answers 404.
export const MISSING_FILE_TYPE_ID = 'adsp-sandbox-missing-file-type';

interface ListedFileType {
  id: string;
  name: string;
}

const APPLICATION_SETUP = `import { useMemo } from 'react';
import { FileClient } from '@abgov/adsp-components-core';
import { ADSPFileUpload } from '@abgov/adsp-components-react';

// fileServiceUrl: from the ADSP directory (urn:ads:platform:file-service)
//   Development: https://file-service.adsp-dev.gov.ab.ca
//   UAT:         https://file-service.adsp-uat.alberta.ca
//   Production:  https://file-service.adsp.alberta.ca
// getAccessToken: your app's sign-in, returning the user's token

// Create the client once: a new client on every render reloads the File Type.
const client = useMemo(
  () => new FileClient({ serviceUrl: fileServiceUrl, getAccessToken }),
  [fileServiceUrl],
);

<ADSPFileUpload client={client} fileTypeId="my-file-type" />`;

const usage = (fileTypeId: string) => `<ADSPFileUpload client={client} fileTypeId="${fileTypeId}" />`;

const RECORD_USAGE = (fileTypeId: string) => `<ADSPFileUpload
  client={client}
  fileTypeId="${fileTypeId}"
  recordId="application-123"
  onUpload={(file) => setFiles((files) => [...files, file])}
/>`;

const MISSING_USAGE = `<ADSPFileUpload client={client} fileTypeId="${MISSING_FILE_TYPE_ID}" />`;

const NO_PERMISSION_USAGE = `// The application decides the user can't upload; nothing renders and nothing is requested.
<ADSPFileUpload client={client} fileTypeId="my-file-type" canUpload={false} />`;

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

export const AdspFileUploadExample = () => {
  const directory = useSelector(directorySelector);
  const fileServiceUrl = directory?.[FILE_SERVICE_ID];

  const client = useMemo(
    () => (fileServiceUrl ? new FileClient({ serviceUrl: fileServiceUrl, getAccessToken }) : null),
    [fileServiceUrl],
  );

  const [fileTypes, setFileTypes] = useState<ListedFileType[]>([]);
  const [listError, setListError] = useState<string>();
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [enteredTypeId, setEnteredTypeId] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);

  const loadFileTypes = async () => {
    if (!fileServiceUrl) {
      return;
    }

    try {
      setListError(undefined);
      const token = await getAccessToken();
      const response = await fetch(new URL('/file/v1/types', fileServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Unable to load file types (${response.status}).`);
      }

      const types = (await response.json()) as ListedFileType[];
      setFileTypes(types);
      setSelectedTypeId((current) => current || types[0]?.id || '');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Unable to load file types.');
    }
  };

  useEffect(() => {
    void loadFileTypes();
    // Load once the File service URL is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileServiceUrl]);

  const exampleTypeId = enteredTypeId.trim() || selectedTypeId;

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="adsp-file-upload-container"
        heading="ADSP file upload"
      >
        <GoabText size="body-m" mt="none">
          ADSPFileUpload uploads files to a File service File Type. It uses the application's sign-in, supports drag and
          drop and the file picker, shows progress, and explains rejections. File service still validates and authorizes
          every upload.
        </GoabText>

        {!client ? (
          <GoabText size="body-m" data-testid="file-service-unavailable">
            The File service URL isn't available from the directory yet.
          </GoabText>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
              <GoabFormItem label="File type" labelSize="compact" helpText="File types you can use in this tenant.">
                <GoabDropdown
                  name="adsp-file-upload-type"
                  value={selectedTypeId}
                  width="100%"
                  size="compact"
                  disabled={fileTypes.length === 0}
                  onChange={(detail) => setSelectedTypeId(detail.value)}
                >
                  {fileTypes.map((type) => (
                    <GoabDropdownItem key={type.id} value={type.id} label={type.name} />
                  ))}
                </GoabDropdown>
              </GoabFormItem>
              <GoabFormItem
                label="Or a file type ID"
                labelSize="compact"
                helpText="Try a file type you aren't permitted to upload to."
              >
                <GoabInput
                  name="adsp-file-upload-type-id"
                  value={enteredTypeId}
                  width="100%"
                  size="compact"
                  testId="adsp-file-upload-type-id"
                  onChange={(detail) => setEnteredTypeId(detail.value)}
                />
              </GoabFormItem>
            </div>

            <GoabButton type="secondary" size="compact" mt="s" onClick={() => void loadFileTypes()}>
              Reload file types
            </GoabButton>
            {listError && <GoabText size="body-s">{listError}</GoabText>}
            {!listError && fileTypes.length === 0 && (
              <GoabText size="body-s">
                No file types found. Add one in File service to try the examples, or enter a file type ID.
              </GoabText>
            )}

            <GoabTabs initialTab={1} navigation="none" testId="adsp-file-upload-tabs">
              <GoabTab heading="Showcase">
                {exampleTypeId && (
                  <>
                    <Example
                      heading="Default"
                      description="Only the client and the File Type: drop a file or choose one to upload it."
                      code={usage(exampleTypeId)}
                    >
                      <ADSPFileUpload client={client} fileTypeId={exampleTypeId} testId="example-default" />
                    </Example>

                    <Example
                      heading="Linked to a record"
                      description="recordId ties each upload to a record in your application; onUpload hands back the stored file."
                      code={RECORD_USAGE(exampleTypeId)}
                    >
                      <ADSPFileUpload
                        client={client}
                        fileTypeId={exampleTypeId}
                        recordId="adsp-sandbox-upload-example"
                        onUpload={(file) => setUploadedFiles((files) => [...files, file])}
                        testId="example-record"
                      />
                      {uploadedFiles.length > 0 && (
                        <GoabTable width="100%" mt="m" testId="example-record-files">
                          <thead>
                            <tr>
                              <th>File</th>
                              <th>File ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadedFiles.map((file) => (
                              <tr key={file.id}>
                                <td>{file.filename}</td>
                                <td>{file.id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </GoabTable>
                      )}
                    </Example>
                  </>
                )}

                <Example
                  heading="Missing file type"
                  description="File service answers 404 for the File Type, so the component says uploads aren't set up."
                  code={MISSING_USAGE}
                >
                  <ADSPFileUpload client={client} fileTypeId={MISSING_FILE_TYPE_ID} testId="example-missing" />
                </Example>

                <Example
                  heading="Upload not permitted by the application"
                  description="With canUpload={false} the component renders nothing, so there is nothing to see here. A user File service refuses sees a permission message instead: enter the ID of a file type you can't upload to."
                  code={NO_PERMISSION_USAGE}
                >
                  <ADSPFileUpload
                    client={client}
                    fileTypeId={exampleTypeId || MISSING_FILE_TYPE_ID}
                    canUpload={false}
                    testId="example-denied"
                  />
                </Example>

                <GoabDetails heading="Application setup" mt="xl">
                  <pre>{APPLICATION_SETUP}</pre>
                </GoabDetails>
              </GoabTab>
              <GoabTab heading="Examples with code">
                <AdspFileUploadSideBySide client={client} fileTypeId={exampleTypeId} />
              </GoabTab>
            </GoabTabs>
          </>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};

export default AdspFileUploadExample;
