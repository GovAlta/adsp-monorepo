import { saveFile } from './saveFile';

describe('saveFile', () => {
  const createObjectURL = jest.fn(() => 'blob:https://app.test/1');
  const revokeObjectURL = jest.fn();
  let click: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('clicks a temporary download link for the blob with the filename', () => {
    // Arrange
    const blob = new Blob(['content']);

    // Act
    saveFile(blob, 'Annual report.pdf');

    // Assert
    const clicked = click.mock.contexts[0] as HTMLAnchorElement;
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked.href).toBe('blob:https://app.test/1');
    expect(clicked.download).toBe('Annual report.pdf');
    expect(document.body.contains(clicked)).toBe(false);
  });

  test('releases the object URL after a delay, not straight away', () => {
    // Arrange, Act
    saveFile(new Blob(['content']), 'file.txt');

    // Assert
    expect(revokeObjectURL).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:https://app.test/1');
  });
});
