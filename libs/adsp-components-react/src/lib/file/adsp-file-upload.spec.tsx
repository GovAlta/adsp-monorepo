import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileServiceError, type FileMetadata, type IFileUploadClient } from '@abgov/adsp-components-core';
import { ADSPFileUpload, FILE_SERVICE_MAX_FILE_SIZE } from './adsp-file-upload';
import { AdspThemeProvider } from '../theme/adsp-theme-provider';

const fileTypeId = 'supporting-docs';
const fileType = { id: fileTypeId, name: 'Supporting documents', anonymousRead: false };
const file = new File(['%PDF-1.7'], 'Annual report.pdf', { type: 'application/pdf' });

const stored = (): FileMetadata => ({
  id: 'file-1',
  urn: 'urn:ads:platform:file-service:v1:/files/file-1',
  filename: 'Annual report.pdf',
  size: 8,
  scanned: false,
  infected: false,
});

type MockClient = IFileUploadClient & Record<keyof IFileUploadClient, jest.Mock>;

const createClient = (overrides: Partial<IFileUploadClient> = {}): MockClient =>
  ({
    getFileType: jest.fn().mockResolvedValue(fileType),
    uploadFile: jest.fn().mockResolvedValue(stored()),
    ...overrides,
  }) as MockClient;

// GoA web components take a `testid` attribute rather than data-testid.
const byGoaTestId = (id: string) => document.querySelector<HTMLElement>(`[testid="${id}"]`);
const findGoa = (id: string) =>
  waitFor(() => {
    const element = byGoaTestId(id);
    expect(element).not.toBeNull();
    return element as HTMLElement;
  });

// The GoA wrappers listen for the web components' custom events rather than DOM events.
const selectFile = (selected: File) =>
  act(() => {
    fireEvent(
      byGoaTestId('upload-input') as HTMLElement,
      new CustomEvent('_selectFile', { detail: { file: selected } }),
    );
  });
const clickGoabButton = (label: string) => fireEvent(screen.getByText(label), new CustomEvent('_click'));

const renderUpload = async (client: MockClient, props: Partial<Parameters<typeof ADSPFileUpload>[0]> = {}) => {
  render(<ADSPFileUpload client={client} fileTypeId={fileTypeId} testId="upload" {...props} />);
  await findGoa('upload-input');
};

describe('ADSPFileUpload', () => {
  test('shows loading feedback, then a drag-and-drop area that accepts files up to the File service limit', async () => {
    // Arrange
    const client = createClient();

    // Act
    render(<ADSPFileUpload client={client} fileTypeId={fileTypeId} testId="upload" />);

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Loading upload details...');
    const input = await findGoa('upload-input');
    expect(input).toHaveAttribute('variant', 'dragdrop');
    expect(input).toHaveAttribute('maxfilesize', FILE_SERVICE_MAX_FILE_SIZE);
    expect(client.getFileType).toHaveBeenCalledWith(fileTypeId);
  });

  test('uploads a selected file and confirms it', async () => {
    // Arrange
    const onUpload = jest.fn();
    const client = createClient();
    await renderUpload(client, { recordId: 'record-1', onUpload });

    // Act
    selectFile(file);

    // Assert
    expect(await screen.findByText('Annual report.pdf uploaded.')).toHaveAttribute('role', 'status');
    expect(client.uploadFile).toHaveBeenCalledWith(fileTypeId, file, expect.objectContaining({ recordId: 'record-1' }));
    expect(onUpload).toHaveBeenCalledWith(stored());
    expect(byGoaTestId('upload-card') as HTMLElement).toHaveAttribute('progress', '-1');
  });

  test('shows progress and hides the drop area while uploading', async () => {
    // Arrange
    let report: (fraction: number) => void = () => undefined;
    const client = createClient({
      uploadFile: jest.fn((_type, _file, options) => {
        report = options.onProgress;
        return new Promise(() => undefined);
      }),
    });
    await renderUpload(client);

    // Act
    selectFile(file);
    act(() => report(0.5));

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Uploading Annual report.pdf...');
    expect(byGoaTestId('upload-card') as HTMLElement).toHaveAttribute('progress', '50');
    expect(byGoaTestId('upload-card') as HTMLElement).toHaveAttribute('filename', 'Annual report.pdf');
    expect(byGoaTestId('upload-input')).toBeNull();
  });

  test('cancelling an upload returns to the drop area without an error', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn(
        (_type, _file, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError'))),
          ),
      ),
    });
    await renderUpload(client);
    selectFile(file);

    // Act
    await act(async () => {
      fireEvent(
        byGoaTestId('upload-card') as HTMLElement,
        new CustomEvent('_cancel', { detail: { filename: file.name } }),
      );
    });

    // Assert
    expect(byGoaTestId('upload-input')).not.toBeNull();
    expect(byGoaTestId('upload-card')).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('explains a File service rejection without offering to retry', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn().mockRejectedValue(new FileServiceError('unavailable', 'Invalid filename', 400)),
    });
    await renderUpload(client);

    // Act
    selectFile(file);

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("File service didn't accept this file. Check the file and try again.");
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
    expect(byGoaTestId('upload-card') as HTMLElement).toHaveAttribute(
      'error',
      "File service didn't accept this file. Check the file and try again.",
    );
    expect(byGoaTestId('upload-input')).not.toBeNull();
  });

  test('offers to retry an unexpected failure, then uploads the same file', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue(stored()),
    });
    await renderUpload(client);
    selectFile(file);
    await screen.findByText('Something went wrong while uploading this file.');

    // Act
    clickGoabButton('Try again');

    // Assert
    expect(await screen.findByText('Annual report.pdf uploaded.')).toBeInTheDocument();
    expect(client.uploadFile).toHaveBeenCalledTimes(2);
    expect(client.uploadFile).toHaveBeenLastCalledWith(fileTypeId, file, expect.anything());
  });

  test.each([
    ['forbidden', 403, "You don't have permission to upload files here."],
    ['not-found', 404, "Files can't be uploaded here because the file type isn't set up."],
    ['unauthenticated', 401, 'Sign in to upload files.'],
  ] as const)('explains a %s File Type and shows no drop area', async (reason, status, message) => {
    // Arrange
    const client = createClient({
      getFileType: jest.fn().mockRejectedValue(new FileServiceError(reason, 'no', status)),
    });

    // Act
    render(<ADSPFileUpload client={client} fileTypeId={fileTypeId} testId="upload" />);

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(byGoaTestId('upload-input')).toBeNull();
  });

  test('renders nothing and requests nothing when the application does not permit uploads', () => {
    // Arrange
    const client = createClient();

    // Act
    const { container } = render(<ADSPFileUpload client={client} fileTypeId={fileTypeId} canUpload={false} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
    expect(client.getFileType).not.toHaveBeenCalled();
  });

  test('applies the theme and per-instance overrides as CSS variables', async () => {
    // Arrange
    const client = createClient();

    // Act
    render(
      <AdspThemeProvider>
        <ADSPFileUpload
          client={client}
          fileTypeId={fileTypeId}
          testId="upload"
          themeOverrides={{ successTextColor: 'rebeccapurple' }}
        />
      </AdspThemeProvider>,
    );

    // Assert
    const root = screen.getByTestId('upload');
    await waitFor(() =>
      expect(root.style.getPropertyValue('--adsp-components-file-upload-success-text-color')).toBe('rebeccapurple'),
    );
    expect(root.style.getPropertyValue('--adsp-components-file-upload-error-text-color')).toBe(
      'var(--adsp-color-status-emergency)',
    );
    expect(root).toHaveClass('adsp-file-upload');
  });
  test('moves focus back into the component after a cancelled upload', async () => {
    // Arrange
    const client = createClient({
      uploadFile: jest.fn(
        (_type, _file, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError'))),
          ),
      ),
    });
    await renderUpload(client);
    selectFile(file);

    // Act
    await act(async () => {
      fireEvent(
        byGoaTestId('upload-card') as HTMLElement,
        new CustomEvent('_cancel', { detail: { filename: file.name } }),
      );
    });

    // Assert
    // jsdom renders the GoA input without its shadow root, so it can't take focus and the component root does.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('upload')));
    expect(byGoaTestId('upload-input')).not.toBeNull();
  });

  test('moves focus to the error when Try again fails again', async () => {
    // Arrange
    const client = createClient({ uploadFile: jest.fn().mockRejectedValue(new TypeError('offline')) });
    await renderUpload(client);
    selectFile(file);
    await screen.findByText('Something went wrong while uploading this file.');

    // Act
    clickGoabButton('Try again');

    // Assert
    await waitFor(() => expect(client.uploadFile).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('alert')));
  });
});
