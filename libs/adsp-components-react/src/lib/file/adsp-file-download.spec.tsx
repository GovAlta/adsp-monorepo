import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoabButton } from '@abgov/react-components';
import { FileServiceError, type FileMetadata, type IFileClient } from '@abgov/adsp-components-core';
import { AdspFileDownload, GoAFileDownload } from './adsp-file-download';
import { AdspThemeProvider } from '../theme/adsp-theme-provider';
import { saveFile } from './saveFile';

jest.mock('./saveFile', () => ({ saveFile: jest.fn() }));
const saveFileMock = saveFile as jest.Mock;

const fileId = 'a217db73-0c29-4fbd-b576-49d049f855a6';

const metadata = (overrides: Partial<FileMetadata> = {}): FileMetadata => ({
  id: fileId,
  urn: `urn:ads:platform:file-service:v1:/files/${fileId}`,
  filename: 'Annual report.pdf',
  size: 1_048_576,
  mimeType: 'application/pdf',
  scanned: true,
  infected: false,
  ...overrides,
});

const downloaded = () => ({ blob: new Blob(['%PDF-1.7']), filename: 'Annual report.pdf', mimeType: 'application/pdf' });

const createClient = (overrides: Partial<IFileClient> = {}): IFileClient & Record<keyof IFileClient, jest.Mock> =>
  ({
    getFile: jest.fn().mockResolvedValue(metadata()),
    downloadFile: jest.fn().mockResolvedValue(downloaded()),
    ...overrides,
  }) as IFileClient & Record<keyof IFileClient, jest.Mock>;

// The GoA button wrapper listens for the web component's custom `_click` event rather than a DOM click.
const clickGoabButton = (label: string) => fireEvent(screen.getByText(label), new CustomEvent('_click'));
const goaButton = (label: string) => screen.getByText(label).closest('goa-button');

describe('AdspFileDownload', () => {
  beforeEach(() => {
    saveFileMock.mockReset();
  });

  describe('default control', () => {
    test('shows loading feedback, then the filename and size from File service', async () => {
      // Arrange
      const client = createClient();

      // Act
      render(<AdspFileDownload client={client} fileId={fileId} />);

      // Assert
      expect(screen.getByRole('status')).toHaveTextContent('Loading file details...');
      expect(await screen.findByText('Annual report.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(goaButton('Annual report.pdf')).toHaveAttribute('type', 'tertiary');
      expect(goaButton('Annual report.pdf')).toHaveAttribute('leadingicon', 'download');
    });

    test('downloads the file when the control is clicked', async () => {
      // Arrange
      const client = createClient();
      render(<AdspFileDownload client={client} fileId={fileId} />);
      await screen.findByText('Annual report.pdf');

      // Act
      clickGoabButton('Annual report.pdf');

      // Assert
      await waitFor(() => expect(saveFileMock).toHaveBeenCalledWith(expect.any(Blob), 'Annual report.pdf'));
      expect(client.downloadFile).toHaveBeenCalledWith(fileId);
    });

    test('shows that the download is in progress and disables the control', async () => {
      // Arrange
      const client = createClient({ downloadFile: jest.fn(() => new Promise(() => undefined)) });
      render(<AdspFileDownload client={client} fileId={fileId} testId="file" />);
      await screen.findByText('Annual report.pdf');

      // Act
      clickGoabButton('Annual report.pdf');

      // Assert
      expect(await screen.findByRole('status')).toHaveTextContent('Downloading...');
      expect(goaButton('Annual report.pdf')).toHaveAttribute('disabled', 'true');
      // aria-busy would hold back the status announcement until the download finished.
      expect(screen.getByTestId('file')).not.toHaveAttribute('aria-busy');
    });

    test('says the file is missing, without a retry, when File service returns 404', async () => {
      // Arrange
      const client = createClient({
        getFile: jest.fn().mockRejectedValue(new FileServiceError('not-found', 'File request failed', 404)),
      });

      // Act
      render(<AdspFileDownload client={client} fileId={fileId} />);

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent("This file doesn't exist or has been removed.");
      expect(screen.queryByText('Try again')).not.toBeInTheDocument();
      expect(screen.queryByText('Annual report.pdf')).not.toBeInTheDocument();
    });

    test('says the user may not download the file when File service returns 403', async () => {
      // Arrange
      const client = createClient({
        getFile: jest.fn().mockRejectedValue(new FileServiceError('forbidden', 'File request failed', 403)),
      });

      // Act
      render(<AdspFileDownload client={client} fileId={fileId} />);

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent("You don't have permission to download this file.");
      expect(screen.queryByText('Try again')).not.toBeInTheDocument();
    });

    test('disables the control while the virus scan is pending and lets the user check again', async () => {
      // Arrange
      const client = createClient({
        getFile: jest
          .fn()
          .mockResolvedValueOnce(metadata({ scanned: false }))
          .mockResolvedValueOnce(metadata()),
      });
      render(<AdspFileDownload client={client} fileId={fileId} />);
      expect(await screen.findByRole('alert')).toHaveTextContent('This file is still being checked for viruses.');
      expect(goaButton('Annual report.pdf')).toHaveAttribute('disabled', 'true');

      // Act
      clickGoabButton('Try again');

      // Assert
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      expect(goaButton('Annual report.pdf')).not.toHaveAttribute('disabled', 'true');
      expect(client.downloadFile).not.toHaveBeenCalled();
    });

    test('says an infected file cannot be downloaded', async () => {
      // Arrange
      const client = createClient({ getFile: jest.fn().mockResolvedValue(metadata({ infected: true })) });

      // Act
      render(<AdspFileDownload client={client} fileId={fileId} />);

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent("This file can't be downloaded.");
      expect(goaButton('Annual report.pdf')).toHaveAttribute('disabled', 'true');
    });

    test('lets the user retry a download that failed unexpectedly', async () => {
      // Arrange
      const client = createClient({
        downloadFile: jest
          .fn()
          .mockRejectedValueOnce(new FileServiceError('unexpected', 'File download failed', 500))
          .mockResolvedValueOnce(downloaded()),
      });
      render(<AdspFileDownload client={client} fileId={fileId} />);
      await screen.findByText('Annual report.pdf');
      clickGoabButton('Annual report.pdf');
      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong while downloading this file.');

      // Act
      clickGoabButton('Try again');

      // Assert
      await waitFor(() => expect(saveFileMock).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('keeps focus in the component after a successful retry removes Try again', async () => {
      // Arrange
      const client = createClient({
        getFile: jest
          .fn()
          .mockResolvedValueOnce(metadata({ scanned: false }))
          .mockResolvedValueOnce(metadata()),
      });
      render(<AdspFileDownload client={client} fileId={fileId} testId="file" />);
      await screen.findByRole('alert');

      // Act
      clickGoabButton('Try again');

      // Assert
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByTestId('file')).toContainElement(document.activeElement as HTMLElement));
    });

    test('moves focus to the error when a retry fails again', async () => {
      // Arrange
      const client = createClient({
        getFile: jest.fn().mockResolvedValue(metadata({ scanned: false })),
      });
      render(<AdspFileDownload client={client} fileId={fileId} />);
      await screen.findByRole('alert');

      // Act
      clickGoabButton('Try again');

      // Assert
      await waitFor(() => expect(client.getFile).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.getByRole('alert')).toContainElement(document.activeElement as HTMLElement));
    });
  });

  describe('custom trigger', () => {
    test('uses the given element as the trigger without loading metadata', async () => {
      // Arrange
      const client = createClient();
      render(
        <AdspFileDownload client={client} fileId={fileId}>
          <GoabButton type="secondary">Download</GoabButton>
        </AdspFileDownload>,
      );

      // Act
      clickGoabButton('Download');

      // Assert
      await waitFor(() => expect(saveFileMock).toHaveBeenCalledWith(expect.any(Blob), 'Annual report.pdf'));
      expect(client.getFile).not.toHaveBeenCalled();
      expect(goaButton('Download')).toHaveAttribute('type', 'secondary');
    });

    test('keeps a link trigger from navigating and still calls its own onClick', async () => {
      // Arrange
      const client = createClient();
      const onClick = jest.fn();
      render(
        <AdspFileDownload client={client} fileId={fileId}>
          <a href="/somewhere" onClick={onClick}>
            Annual report
          </a>
        </AdspFileDownload>,
      );

      // Act
      const notCancelled = fireEvent.click(screen.getByText('Annual report'));

      // Assert
      expect(notCancelled).toBe(false);
      expect(onClick).toHaveBeenCalled();
      await waitFor(() => expect(saveFileMock).toHaveBeenCalled());
    });

    test('disables the trigger and shows progress while downloading', async () => {
      // Arrange
      const client = createClient({ downloadFile: jest.fn(() => new Promise(() => undefined)) });
      render(
        <AdspFileDownload client={client} fileId={fileId}>
          <button type="button">Download</button>
        </AdspFileDownload>,
      );

      // Act
      fireEvent.click(screen.getByText('Download'));

      // Assert
      expect(await screen.findByRole('status')).toHaveTextContent('Downloading...');
      expect(screen.getByText('Download')).toBeDisabled();
    });

    test('shows File service errors from the download itself', async () => {
      // Arrange
      const client = createClient({
        downloadFile: jest.fn().mockRejectedValue(new FileServiceError('scan-pending', 'File download failed', 400)),
      });
      render(
        <AdspFileDownload client={client} fileId={fileId}>
          <button type="button">Download</button>
        </AdspFileDownload>,
      );

      // Act
      fireEvent.click(screen.getByText('Download'));

      // Assert
      expect(await screen.findByRole('alert')).toHaveTextContent('This file is still being checked for viruses.');
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    test('marks a link trigger aria-disabled while downloading and ignores clicks on it', async () => {
      // Arrange
      const client = createClient({ downloadFile: jest.fn(() => new Promise(() => undefined)) });
      const onClick = jest.fn();
      render(
        <AdspFileDownload client={client} fileId={fileId}>
          <a href="/somewhere" onClick={onClick}>
            Annual report
          </a>
        </AdspFileDownload>,
      );
      fireEvent.click(screen.getByText('Annual report'));
      await screen.findByRole('status');

      // Act
      const notCancelled = fireEvent.click(screen.getByText('Annual report'));

      // Assert
      const link = screen.getByText('Annual report');
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).not.toHaveAttribute('disabled');
      expect(notCancelled).toBe(false);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(client.downloadFile).toHaveBeenCalledTimes(1);
    });

    test('puts focus back on the trigger after a retried download succeeds', async () => {
      // Arrange
      const client = createClient({
        downloadFile: jest
          .fn()
          .mockRejectedValueOnce(new FileServiceError('unexpected', 'File download failed', 500))
          .mockResolvedValueOnce(downloaded()),
      });
      render(
        <AdspFileDownload client={client} fileId={fileId}>
          <button type="button">Download</button>
        </AdspFileDownload>,
      );
      fireEvent.click(screen.getByText('Download'));
      await screen.findByRole('alert');

      // Act
      clickGoabButton('Try again');

      // Assert
      await waitFor(() => expect(saveFileMock).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.getByText('Download')).toHaveFocus());
    });
  });

  describe('client and permission', () => {
    test('is also exported as GoAFileDownload, the name the design uses', async () => {
      // Arrange
      const client = createClient();

      // Act
      render(<GoAFileDownload client={client} fileId={fileId} />);

      // Assert
      expect(await screen.findByText('Annual report.pdf')).toBeInTheDocument();
      expect(client.getFile).toHaveBeenCalledWith(fileId);
    });

    test('renders nothing and sends no request when the application says the user cannot download', () => {
      // Arrange
      const client = createClient();

      // Act
      const { container } = render(<AdspFileDownload client={client} fileId={fileId} canDownload={false} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
      expect(client.getFile).not.toHaveBeenCalled();
    });

    test('sends no download request when the application says the user cannot download', () => {
      // Arrange
      const client = createClient();

      // Act
      render(
        <AdspFileDownload client={client} fileId={fileId} canDownload={false}>
          <button type="button">Download</button>
        </AdspFileDownload>,
      );

      // Assert
      expect(screen.queryByText('Download')).not.toBeInTheDocument();
      expect(client.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('theming', () => {
    test('sets the theme tokens on its root element', async () => {
      // Arrange
      const client = createClient();

      // Act
      render(<AdspFileDownload client={client} fileId={fileId} testId="file" />);

      // Assert
      await screen.findByText('Annual report.pdf');
      const root = screen.getByTestId('file');
      expect(root).toHaveClass('adsp-file-download');
      expect(root.style.getPropertyValue('--adsp-components-file-download-error-text-color')).toBe(
        'var(--adsp-color-status-emergency)',
      );
    });

    test('applies provider overrides and then instance overrides', async () => {
      // Arrange
      const client = createClient();

      // Act
      render(
        <AdspThemeProvider overrides={{ components: { fileDownload: { metadataTextColor: 'provider-color' } } }}>
          <AdspFileDownload
            client={client}
            fileId={fileId}
            testId="file"
            themeOverrides={{ errorTextColor: 'instance-color' }}
          />
        </AdspThemeProvider>,
      );

      // Assert
      await screen.findByText('Annual report.pdf');
      const root = screen.getByTestId('file');
      expect(root.style.getPropertyValue('--adsp-components-file-download-metadata-text-color')).toBe('provider-color');
      expect(root.style.getPropertyValue('--adsp-components-file-download-error-text-color')).toBe('instance-color');
    });
  });
});
