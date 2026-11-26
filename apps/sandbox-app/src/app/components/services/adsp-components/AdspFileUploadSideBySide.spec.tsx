import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AdspFileUploadSideBySide,
  SIDE_BY_SIDE_MISSING_FILE_TYPE_ID,
  SIDE_BY_SIDE_RECORD_ID,
} from './AdspFileUploadSideBySide';
import type { FileTypeCapabilities } from './useFileTypeCapabilities';

type UploadProps = {
  client: unknown;
  fileTypeId: string;
  testId?: string;
  recordId?: string;
  themeOverrides?: unknown;
  canUpload?: boolean;
  fallback?: React.ReactNode;
  onUpload?: (file: unknown) => void;
};

const mockFileUpload = jest.fn((props: UploadProps) => (
  <div data-testid={props.testId} data-file-type-id={props.fileTypeId} />
));
const mockFileDownload = jest.fn((props: { client: unknown; fileId: string; testId?: string }) => (
  <div data-testid={props.testId} data-file-id={props.fileId} />
));

// The real capability provider, with an upload stand-in that asks it like ADSPFileUpload does.
jest.mock('@abgov/adsp-components-react', () => {
  // The capability module on its own, so the rest of the library (the calendar) isn't loaded.
  const actual = jest.requireActual('../../../../../../../libs/adsp-components-react/src/lib/capability');
  return {
    AdspCapabilityProvider: actual.AdspCapabilityProvider,
    ADSPFileUpload: (props) =>
      actual.useCapability('file.upload', props.canUpload) ? mockFileUpload(props) : (props.fallback ?? null),
    ADSPFileDownload: (props) => mockFileDownload(props),
  };
});

jest.mock('../../../state', () => ({ getAccessToken: jest.fn() }));

const client = { getFile: jest.fn(), downloadFile: jest.fn(), getFileType: jest.fn(), uploadFile: jest.fn() };
const fileTypeId = 'supporting-docs';
const roles = ['urn:ads:platform:file-service:applicant'];
const uploaders: FileTypeCapabilities = { status: 'resolved', capabilities: { 'file.upload': roles } };
const readersOnly: FileTypeCapabilities = { status: 'resolved', capabilities: { 'file.upload': ['clerk'] } };
const storedFile = (id: string, filename: string) => ({
  id,
  filename,
  urn: '',
  size: 1,
  scanned: false,
  infected: false,
});

const latestProps = (testId: string) =>
  mockFileUpload.mock.calls
    .map(([props]) => props)
    .filter((props) => props.testId === testId)
    .pop() as UploadProps;

describe('AdspFileUploadSideBySide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows four examples, each with its result and its code', () => {
    // Arrange, Act
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);

    // Assert
    ['minimal', 'record', 'upload-download', 'themed'].forEach((name) => {
      const example = within(screen.getByTestId(`side-by-side-${name}`));
      expect(example.getByText('Result')).toBeInTheDocument();
      expect(example.getByText('Code')).toBeInTheDocument();
    });
  });

  test('uploads to the picked file type with the client in the minimal example', () => {
    // Arrange, Act
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);

    // Assert
    expect(screen.getByTestId('side-by-side-minimal-upload')).toHaveAttribute('data-file-type-id', fileTypeId);
    expect(
      within(screen.getByTestId('side-by-side-minimal')).getByText(/fileServiceUrl: from the ADSP directory/),
    ).toHaveTextContent('<ADSPFileUpload client={client} fileTypeId="my-file-type" />');
  });

  test('lists the File service URL for each environment in the minimal example code', () => {
    // Arrange, Act
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);

    // Assert
    const code = within(screen.getByTestId('side-by-side-minimal')).getByText(
      /fileServiceUrl: from the ADSP directory/,
    );
    expect(code).toHaveTextContent('Development: https://file-service.adsp-dev.gov.ab.ca');
    expect(code).toHaveTextContent('UAT: https://file-service.adsp-uat.alberta.ca');
    expect(code).toHaveTextContent('Production: https://file-service.adsp.alberta.ca');
  });

  test('passes the client to every upload', () => {
    // Arrange, Act
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);

    // Assert
    expect(mockFileUpload.mock.calls.length).toBeGreaterThan(0);
    mockFileUpload.mock.calls.forEach(([props]) => expect(props.client).toBe(client));
  });

  test('lists each file uploaded for the record', () => {
    // Arrange
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);
    expect(latestProps('side-by-side-record-upload').recordId).toBe(SIDE_BY_SIDE_RECORD_ID);

    // Act
    act(() => latestProps('side-by-side-record-upload').onUpload?.(storedFile('file-1', 'Annual report.pdf')));
    act(() => latestProps('side-by-side-record-upload').onUpload?.(storedFile('file-2', 'Photo.png')));

    // Assert
    const list = screen.getByTestId('side-by-side-record-files');
    expect(within(list).getByText('Annual report.pdf')).toBeInTheDocument();
    expect(within(list).getByText('Photo.png')).toBeInTheDocument();
  });

  test('offers the uploaded file for download with the same client', () => {
    // Arrange
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);
    expect(screen.queryByTestId('side-by-side-upload-download-download')).not.toBeInTheDocument();

    // Act
    act(() => latestProps('side-by-side-upload-download-upload').onUpload?.(storedFile('file-9', 'Notes.txt')));

    // Assert
    expect(screen.getByTestId('side-by-side-upload-download-download')).toHaveAttribute('data-file-id', 'file-9');
    expect(mockFileDownload).toHaveBeenCalledWith(expect.objectContaining({ client }));
  });

  test('themes both a working upload and a missing file type so the overrides are visible', () => {
    // Arrange, Act
    render(<AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={uploaders} roles={roles} />);

    // Assert
    expect(screen.getByTestId('side-by-side-themed-missing')).toHaveAttribute(
      'data-file-type-id',
      SIDE_BY_SIDE_MISSING_FILE_TYPE_ID,
    );
    expect(latestProps('side-by-side-themed-upload').themeOverrides).toEqual({
      successTextColor: 'var(--adsp-color-interactive-default)',
      errorTextColor: 'var(--adsp-color-status-important)',
    });
  });

  test('tells a user without an update role that they cannot upload, before any file is chosen', () => {
    // Arrange, Act
    render(
      <AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={readersOnly} roles={roles} />,
    );

    // Assert
    ['minimal', 'record', 'upload-download', 'themed'].forEach((name) => {
      expect(screen.queryByTestId(`side-by-side-${name}-upload`)).not.toBeInTheDocument();
      expect(document.querySelector(`[testid="side-by-side-${name}-denied"]`)).toBeInTheDocument();
    });
  });

  test('keeps File service answering for the missing file type when the user cannot upload', () => {
    // Arrange, Act
    render(
      <AdspFileUploadSideBySide client={client} fileTypeId={fileTypeId} capabilities={readersOnly} roles={roles} />,
    );

    // Assert
    expect(screen.getByTestId('side-by-side-themed-missing')).toBeInTheDocument();
  });

  test('lets a File service admin upload whatever the File Type roles are', () => {
    // Arrange, Act
    render(
      <AdspFileUploadSideBySide
        client={client}
        fileTypeId={fileTypeId}
        capabilities={readersOnly}
        roles={['urn:ads:platform:file-service:file-service-admin']}
      />,
    );

    // Assert
    expect(screen.getByTestId('side-by-side-minimal-upload')).toBeInTheDocument();
  });

  test('says it is checking permission while the File Type roles load', () => {
    // Arrange, Act
    render(
      <AdspFileUploadSideBySide
        client={client}
        fileTypeId={fileTypeId}
        capabilities={{ status: 'loading' }}
        roles={roles}
      />,
    );

    // Assert
    expect(screen.getAllByText('Checking your upload permission…')).toHaveLength(4);
    expect(screen.queryByTestId('side-by-side-minimal-upload')).not.toBeInTheDocument();
  });

  test('asks for a file type to be picked before showing the examples', () => {
    // Arrange, Act
    render(<AdspFileUploadSideBySide client={client} fileTypeId="" capabilities={{ status: 'none' }} roles={roles} />);

    // Assert
    expect(screen.getAllByText('Pick a file type above to see this example.')).toHaveLength(4);
    expect(screen.getByTestId('side-by-side-themed-missing')).toBeInTheDocument();
  });
});
