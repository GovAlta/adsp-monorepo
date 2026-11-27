const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({ render: mockRender }));

jest.mock('react-dom/client', () => ({
  __esModule: true,
  default: { createRoot: mockCreateRoot },
  createRoot: mockCreateRoot,
}));
jest.mock('./app/app', () => ({ __esModule: true, default: () => null }));
jest.mock('@abgov/web-components', () => ({}));

describe('subscriber-app entry point', () => {
  it('mounts the app into the root element', () => {
    document.body.innerHTML = '<div id="root"></div>';
    jest.isolateModules(() => {
      require('./main');
    });

    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mockRender).toHaveBeenCalledTimes(1);
  });
});
