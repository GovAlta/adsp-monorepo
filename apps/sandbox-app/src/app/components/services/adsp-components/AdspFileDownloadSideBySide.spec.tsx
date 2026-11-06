import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspFileDownloadSideBySide, MISSING_FILE_ID } from './AdspFileDownloadSideBySide';

const mockFileDownload = jest.fn(
  (props: {
    client: unknown;
    fileId: string;
    testId?: string;
    themeOverrides?: unknown;
    children?: React.ReactNode;
  }) => (
    <div data-testid={props.testId ?? `download-${props.fileId}`} data-file-id={props.fileId}>
      {props.children}
    </div>
  ),
);

jest.mock('@abgov/adsp-components-react', () => ({
  GoAFileDownload: (props) => mockFileDownload(props),
}));

const client = { getFile: jest.fn(), downloadFile: jest.fn() };
const fileId = 'a217db73-0c29-4fbd-b576-49d049f855a6';
const files = [
  { id: fileId, filename: 'Annual report.pdf' },
  { id: 'b317db73-0c29-4fbd-b576-49d049f855a7', filename: 'Photo.png' },
  { id: 'c417db73-0c29-4fbd-b576-49d049f855a8', filename: 'Notes.txt' },
  { id: 'd517db73-0c29-4fbd-b576-49d049f855a9', filename: 'Budget.xlsx' },
];

describe('AdspFileDownloadSideBySide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows four examples, each with its result and its code', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId={fileId} files={files} />);

    // Assert
    ['minimal', 'own-button', 'link-list', 'themed'].forEach((name) => {
      const example = within(screen.getByTestId(`side-by-side-${name}`));
      expect(example.getByText('Result')).toBeInTheDocument();
      expect(example.getByText('Code')).toBeInTheDocument();
    });
  });

  test('downloads the picked file with the client and its ID in the minimal example', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId={fileId} files={files} />);

    // Assert
    expect(screen.getByTestId('side-by-side-minimal-download')).toHaveAttribute('data-file-id', fileId);
    expect(
      within(screen.getByTestId('side-by-side-minimal')).getByText(
        /<GoAFileDownload client=\{client\} fileId=\{file.id\} \/>/,
      ),
    ).toBeInTheDocument();
  });

  test('passes the client to every download', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId={fileId} files={files} />);

    // Assert
    expect(mockFileDownload.mock.calls.length).toBeGreaterThan(0);
    mockFileDownload.mock.calls.forEach(([props]) => expect(props.client).toBe(client));
  });

  test('passes a GoA button as the trigger in the own button example', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId={fileId} files={files} />);

    // Assert
    expect(within(screen.getByTestId('side-by-side-own-button-download')).getByText('Download')).toBeInTheDocument();
  });

  test('lists the first three files as links', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId={fileId} files={files} />);

    // Assert
    const example = within(screen.getByTestId('side-by-side-link-list'));
    expect(example.getByRole('link', { name: 'Annual report.pdf' })).toBeInTheDocument();
    expect(example.getByRole('link', { name: 'Notes.txt' })).toBeInTheDocument();
    expect(example.queryByRole('link', { name: 'Budget.xlsx' })).not.toBeInTheDocument();
  });

  test('themes both a downloadable file and a missing one so the overrides are visible', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId={fileId} files={files} />);

    // Assert
    expect(screen.getByTestId('side-by-side-themed-missing')).toHaveAttribute('data-file-id', MISSING_FILE_ID);
    expect(mockFileDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        testId: 'side-by-side-themed-download',
        themeOverrides: { metadataTextColor: 'var(--adsp-color-status-success)', errorTextColor: '#6a1b9a' },
      }),
    );
  });

  test('asks for a file to be picked before showing the single-file examples', () => {
    // Arrange, Act
    render(<AdspFileDownloadSideBySide client={client} fileId="" files={[]} />);

    // Assert
    expect(screen.getAllByText('Pick a tenant file above to see this example.')).toHaveLength(3);
    expect(screen.getByText('No tenant files to list.')).toBeInTheDocument();
    expect(screen.getByTestId('side-by-side-themed-missing')).toBeInTheDocument();
  });
});
