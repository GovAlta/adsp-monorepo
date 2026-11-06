import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import { AdspFileDownloadExample, MISSING_FILE_ID } from './AdspFileDownloadExample';
import { directorySelector, getAccessToken } from '../../../state';

const mockFileDownload = jest.fn(
  (props: { fileId: string; testId?: string; canDownload?: boolean; children?: unknown }) => (
    <div data-testid={props.testId ?? `download-${props.fileId}`} data-file-id={props.fileId} />
  ),
);
const mockProvider = jest.fn(({ children }: { client: unknown; children: React.ReactNode }) => <>{children}</>);

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../state', () => ({
  directorySelector: jest.fn(),
  getAccessToken: jest.fn(),
}));

jest.mock('@abgov/adsp-components-react', () => ({
  GoAFileDownload: (props) => mockFileDownload(props),
  AdspFileClientProvider: (props) => mockProvider(props),
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

  test('loads tenant files with the user token and provides a file client', async () => {
    // Arrange, Act
    render(<AdspFileDownloadExample />);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(`${fileServiceUrl}/file/v1/files?top=20`, {
        headers: { Authorization: 'Bearer token-abc' },
      }),
    );
    expect(mockProvider).toHaveBeenCalledWith(expect.objectContaining({ client: expect.anything() }));
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

    // Assert
    expect(await screen.findByTestId(`download-${listedFiles[1].id}`)).toBeInTheDocument();
    expect(screen.getByText('Photo.png')).toBeInTheDocument();
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
