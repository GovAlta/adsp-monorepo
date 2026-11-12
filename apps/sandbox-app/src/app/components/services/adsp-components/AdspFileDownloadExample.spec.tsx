import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import { FileClient } from '@abgov/adsp-components-core';
import { AdspFileDownloadExample, MISSING_FILE_ID } from './AdspFileDownloadExample';
import { directorySelector, getAccessToken } from '../../../state';

const mockFileDownload = jest.fn(
  (props: { client: unknown; fileId: string; testId?: string; canDownload?: boolean; children?: unknown }) => (
    <div data-testid={props.testId ?? `download-${props.fileId}`} data-file-id={props.fileId} />
  ),
);

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../state', () => ({
  directorySelector: jest.fn(),
  getAccessToken: jest.fn(),
}));

jest.mock('@abgov/adsp-components-react', () => ({
  ADSPFileDownload: (props) => mockFileDownload(props),
}));

const fileServiceUrl = 'https://file-service.test';
const listedFiles = [
  { id: 'a217db73-0c29-4fbd-b576-49d049f855a6', filename: 'Annual report.pdf', typeName: 'Supporting documents' },
  { id: 'b317db73-0c29-4fbd-b576-49d049f855a7', filename: 'Photo.png', typeName: 'Images' },
];

describe('AdspFileDownloadExample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector === directorySelector ? { 'urn:ads:platform:file-service': fileServiceUrl } : undefined,
    );
    (getAccessToken as jest.Mock).mockResolvedValue('token-abc');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: listedFiles, page: {} }),
    });
  });

  test('says the File service is unavailable when the directory has no URL', () => {
    // Arrange
    (useSelector as jest.Mock).mockReturnValue({});

    // Act
    render(<AdspFileDownloadExample />);

    // Assert
    expect(screen.getByTestId('file-service-unavailable')).toHaveTextContent(
      "The File service URL isn't available from the directory yet.",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('loads tenant files with the user token', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(`${fileServiceUrl}/file/v1/files?top=20`, {
        headers: { Authorization: 'Bearer token-abc' },
      }),
    );
  });

  test('passes every download the same File service client', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);
    await screen.findByTestId('example-default');

    // Assert
    const clients = mockFileDownload.mock.calls.map(([props]) => props.client);
    expect(clients[0]).toBeInstanceOf(FileClient);
    expect(new Set(clients).size).toBe(1);
  });

  test('shows the default and custom trigger examples for the first file', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);

    // Assert
    expect(await screen.findByTestId('example-default')).toHaveAttribute('data-file-id', listedFiles[0].id);
    expect(screen.getByTestId('example-custom')).toHaveAttribute('data-file-id', listedFiles[0].id);
  });

  test('shows a download action for each listed file', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);

    // Assert: the examples with code tab also lists files, so look in the showcase table's row.
    const tableRow = (await screen.findAllByText('Photo.png'))
      .map((element) => element.closest('tr'))
      .find((row): row is HTMLTableRowElement => !!row);
    expect(within(tableRow as HTMLElement).getByTestId(`download-${listedFiles[1].id}`)).toBeInTheDocument();
  });

  test('has an examples with code tab that downloads the picked file', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);

    // Assert
    expect(await screen.findByTestId('side-by-side-minimal-download')).toHaveAttribute(
      'data-file-id',
      listedFiles[0].id,
    );
  });

  test('shows the missing file and not permitted examples', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);

    // Assert
    expect(await screen.findByTestId('example-missing')).toHaveAttribute('data-file-id', MISSING_FILE_ID);
    expect(mockFileDownload).toHaveBeenCalledWith(
      expect.objectContaining({ testId: 'example-denied', canDownload: false }),
    );
  });

  test('reports a failure to list files', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    // Act
    render(<AdspFileDownloadExample />);

    // Assert
    expect(await screen.findByText('Unable to load files (401).')).toBeInTheDocument();
  });
});
