import React from 'react';
import { GoabButton, GoabText } from '@abgov/react-components';
import type { IFileClient } from '@abgov/adsp-components-core';
import { GoAFileDownload } from '@abgov/adsp-components-react';

// A valid UUID that no file has, so File service answers 404.
export const MISSING_FILE_ID = '00000000-0000-4000-8000-000000000000';
const LINK_LIST_SIZE = 3;

export interface SideBySideFile {
  id: string;
  filename: string;
}

interface AdspFileDownloadSideBySideProps {
  client: IFileClient;
  /** The file the single-file examples download; empty until one is picked. */
  fileId: string;
  files: SideBySideFile[];
}

const MINIMAL_CODE = `import { useMemo } from 'react';
import { FileClient } from '@abgov/adsp-components-core';
import { GoAFileDownload } from '@abgov/adsp-components-react';

// fileServiceUrl: from the ADSP directory (urn:ads:platform:file-service)
//   Development: https://file-service.adsp-dev.gov.ab.ca
//   UAT:         https://file-service.adsp-uat.alberta.ca
//   Production:  https://file-service.adsp.alberta.ca
// getAccessToken: your app's sign-in, returning the user's token
// file.id: from your app's data, such as a submission's uploaded files
function SupportingDocument({ file }) {
  const client = useMemo(
    () => new FileClient({ serviceUrl: fileServiceUrl, getAccessToken }),
    [fileServiceUrl],
  );

  return <GoAFileDownload client={client} fileId={file.id} />;
}`;

const OWN_BUTTON_CODE = `import { GoabButton } from '@abgov/react-components';
import { GoAFileDownload } from '@abgov/adsp-components-react';

<GoAFileDownload client={client} fileId={file.id}>
  <GoabButton type="secondary" leadingIcon="download">
    Download
  </GoabButton>
</GoAFileDownload>`;

const LINK_LIST_CODE = `import { GoAFileDownload } from '@abgov/adsp-components-react';

// files: [{ id, filename }] from your app's data
<ul>
  {files.map((file) => (
    <li key={file.id}>
      <GoAFileDownload client={client} fileId={file.id}>
        <a href={\`#\${file.id}\`}>{file.filename}</a>
      </GoAFileDownload>
    </li>
  ))}
</ul>`;

const THEMED_CODE = `import { GoAFileDownload } from '@abgov/adsp-components-react';

const fileTheme = {
  metadataTextColor: 'var(--adsp-color-status-success)',
  errorTextColor: 'var(--adsp-color-status-important)',
};

<GoAFileDownload client={client} fileId={file.id} themeOverrides={fileTheme} />
<GoAFileDownload client={client} fileId={missingFileId} themeOverrides={fileTheme} />`;

// Defined once so the override object keeps its identity across renders.
const FILE_THEME = {
  metadataTextColor: 'var(--adsp-color-status-success)',
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

const PickAFile = () => <GoabText size="body-s">Pick a tenant file above to see this example.</GoabText>;

export const AdspFileDownloadSideBySide = ({ client, fileId, files }: AdspFileDownloadSideBySideProps) => {
  const linkFiles = files.slice(0, LINK_LIST_SIZE);

  return (
    <>
      <GoabText size="body-m" mt="m">
        Each example shows the component on the left and the code for it on the right. Examples 2 to 4 use the client
        created in example 1.
      </GoabText>

      <SideBySide
        heading="1. Minimal: a client and a file ID"
        description="Create a File service client with your app's sign-in, then pass it with the file ID. The filename and size come from File service."
        code={MINIMAL_CODE}
        testId="side-by-side-minimal"
      >
        {fileId ? (
          <GoAFileDownload client={client} fileId={fileId} testId="side-by-side-minimal-download" />
        ) : (
          <PickAFile />
        )}
      </SideBySide>

      <SideBySide
        heading="2. Your own button"
        description="Wrap any button. The component does the download and disables the button while it runs."
        code={OWN_BUTTON_CODE}
        testId="side-by-side-own-button"
      >
        {fileId ? (
          <GoAFileDownload client={client} fileId={fileId} testId="side-by-side-own-button-download">
            <GoabButton type="secondary" leadingIcon="download">
              Download
            </GoabButton>
          </GoAFileDownload>
        ) : (
          <PickAFile />
        )}
      </SideBySide>

      <SideBySide
        heading="3. Filenames as links in a list"
        description="A link works as the trigger too. The component stops it navigating, and doesn't look files up until one is clicked."
        code={LINK_LIST_CODE}
        testId="side-by-side-link-list"
      >
        {linkFiles.length > 0 ? (
          <ul>
            {linkFiles.map((file) => (
              <li key={file.id}>
                <GoAFileDownload client={client} fileId={file.id}>
                  <a href={`#${file.id}`}>{file.filename}</a>
                </GoAFileDownload>
              </li>
            ))}
          </ul>
        ) : (
          <GoabText size="body-s">No tenant files to list.</GoabText>
        )}
      </SideBySide>

      <SideBySide
        heading="4. Themed"
        description="themeOverrides changes the component's own text: the file size, progress and error messages. GoA buttons keep the GoA look."
        code={THEMED_CODE}
        testId="side-by-side-themed"
      >
        {fileId ? (
          <GoAFileDownload
            client={client}
            fileId={fileId}
            themeOverrides={FILE_THEME}
            testId="side-by-side-themed-download"
          />
        ) : (
          <PickAFile />
        )}
        <div style={{ marginTop: '1rem' }}>
          <GoAFileDownload
            client={client}
            fileId={MISSING_FILE_ID}
            themeOverrides={FILE_THEME}
            testId="side-by-side-themed-missing"
          />
        </div>
      </SideBySide>
    </>
  );
};

export default AdspFileDownloadSideBySide;
