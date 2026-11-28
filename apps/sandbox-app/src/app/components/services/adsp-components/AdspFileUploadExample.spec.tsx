import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import { FileClient } from '@abgov/adsp-components-core';
import { AdspFileUploadExample, MISSING_FILE_TYPE_ID } from './AdspFileUploadExample';
import { authenticatedUserSelector, directorySelector, getAccessToken } from '../../../state';

const mockFileUpload = jest.fn(
  (props: {
    client: unknown;
    fileTypeId: string;
    testId?: string;
    canUpload?: boolean;
    fallback?: React.ReactNode;
    recordId?: string;
    onUpload?: (file: unknown) => void;
  }) => <div data-testid={props.testId} data-file-type-id={props.fileTypeId} />,
);

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../state', () => ({
  authenticatedUserSelector: jest.fn(),
  directorySelector: jest.fn(),
  getAccessToken: jest.fn(),
}));

// The real capability provider, with an upload stand-in that asks it like ADSPFileUpload does.
jest.mock('@abgov/adsp-components-react', () => {
  // The capability module on its own, so the rest of the library (the calendar) isn't loaded.
  const actual = jest.requireActual('../../../../../../../libs/adsp-components-react/src/lib/capability');
  return {
    AdspCapabilityProvider: actual.AdspCapabilityProvider,
    ADSPFileUpload: (props) =>
      actual.useCapability('file.upload', props.canUpload) ? mockFileUpload(props) : (props.fallback ?? null),
  };
});

const fileServiceUrl = 'https://file-service.test';
const fileTypes = [
  { id: 'supporting-docs', name: 'Supporting documents' },
  { id: 'images', name: 'Images' },
];
const applicant = 'urn:ads:platform:file-service:applicant';

// The File Type list, then each File Type with the roles that may upload to it.
const fileService =
  (typeResponse: { ok: boolean; status?: number; json?: () => Promise<unknown> }) => async (url: string) =>
    url.endsWith('/file/v1/types') ? { ok: true, json: async () => fileTypes } : typeResponse;
const typeWithUploaders = (updateRoles: string[]) => ({
  ok: true,
  json: async () => ({ id: 'supporting-docs', readRoles: [], updateRoles }),
});

const propsFor = (testId: string) =>
  mockFileUpload.mock.calls
    .map(([props]) => props)
    .filter((p) => p.testId === testId)
    .pop();

describe('AdspFileUploadExample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === directorySelector) return { 'urn:ads:platform:file-service': fileServiceUrl };
      if (selector === authenticatedUserSelector) return { id: 'u1', roles: [applicant] };
      return undefined;
    });
    (getAccessToken as jest.Mock).mockResolvedValue('token-abc');
    global.fetch = jest.fn(fileService(typeWithUploaders([applicant])));
  });

  test('says the File service is unavailable when the directory has no URL', () => {
    // Arrange
    (useSelector as jest.Mock).mockReturnValue({});

    // Act
    render(<AdspFileUploadExample />);

    // Assert
    expect(screen.getByTestId('file-service-unavailable')).toHaveTextContent(
      "The File service URL isn't available from the directory yet.",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('loads the tenant file types with the user token', async () => {
    // Arrange, Act
    render(<AdspFileUploadExample />);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(`${fileServiceUrl}/file/v1/types`, {
        headers: { Authorization: 'Bearer token-abc' },
      }),
    );
  });

  test('uploads to the first file type with one shared File service client', async () => {
    // Arrange, Act
    render(<AdspFileUploadExample />);

    // Assert
    expect(await screen.findByTestId('example-default')).toHaveAttribute('data-file-type-id', 'supporting-docs');
    const clients = mockFileUpload.mock.calls.map(([props]) => props.client);
    expect(clients[0]).toBeInstanceOf(FileClient);
    expect(new Set(clients).size).toBe(1);
  });

  test('shows files uploaded through the record example', async () => {
    // Arrange
    render(<AdspFileUploadExample />);
    await screen.findByTestId('example-record');
    expect(propsFor('example-record')?.recordId).toBe('adsp-sandbox-upload-example');

    // Act
    act(() => propsFor('example-record')?.onUpload?.({ id: 'file-1', filename: 'Annual report.pdf' }));

    // Assert
    // GoA web components take a `testid` attribute rather than data-testid.
    const table = document.querySelector('[testid="example-record-files"]');
    expect(table).toHaveTextContent('Annual report.pdf');
    expect(table).toHaveTextContent('file-1');
  });

  test('demonstrates a missing file type and an application that does not permit uploads', async () => {
    // Arrange, Act
    render(<AdspFileUploadExample />);
    await screen.findByTestId('example-default');

    // Assert
    expect(propsFor('example-missing')?.fileTypeId).toBe(MISSING_FILE_TYPE_ID);
    // canUpload={false} wins over the user's update role, so nothing renders.
    expect(screen.queryByTestId('example-denied')).not.toBeInTheDocument();
  });

  test("reads the picked File Type's roles with the user token", async () => {
    // Arrange, Act
    render(<AdspFileUploadExample />);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(`${fileServiceUrl}/file/v1/types/supporting-docs`, {
        headers: { Authorization: 'Bearer token-abc' },
      }),
    );
  });

  test('tells a user without an update role that they cannot upload, before any file is chosen', async () => {
    // Arrange
    global.fetch = jest.fn(fileService(typeWithUploaders(['urn:ads:platform:file-service:clerk'])));

    // Act
    render(<AdspFileUploadExample />);

    // Assert
    await waitFor(() => expect(document.querySelector('[testid="example-default-denied"]')).toBeInTheDocument());
    expect(document.querySelector('[testid="example-record-denied"]')).toBeInTheDocument();
    expect(screen.queryByTestId('example-default')).not.toBeInTheDocument();
  });

  test('tells a user File service refuses the File Type to that they cannot upload', async () => {
    // Arrange
    global.fetch = jest.fn(fileService({ ok: false, status: 403 }));

    // Act
    render(<AdspFileUploadExample />);

    // Assert
    await waitFor(() => expect(document.querySelector('[testid="example-default-denied"]')).toBeInTheDocument());
  });

  test('leaves a missing File Type for the component to explain', async () => {
    // Arrange
    global.fetch = jest.fn(fileService({ ok: false, status: 404 }));

    // Act
    render(<AdspFileUploadExample />);

    // Assert
    expect(await screen.findByTestId('example-default')).toBeInTheDocument();
    expect(document.querySelector('[testid="example-default-denied"]')).not.toBeInTheDocument();
  });

  test('explains when the file types cannot be loaded', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    // Act
    render(<AdspFileUploadExample />);

    // Assert
    expect(await screen.findByText('Unable to load file types (403).')).toBeInTheDocument();
    expect(screen.queryByTestId('example-default')).not.toBeInTheDocument();
  });
});
