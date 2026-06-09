import axios, { AxiosInstance } from 'axios';
import { ConfigState } from '@store/config/models';
import { FileApi } from './api';

describe('FileApi', () => {
  const deleteMock = jest.fn();
  const httpMock = {
    delete: deleteMock,
    interceptors: {
      request: {
        use: jest.fn(),
      },
    },
  };
  const config = {
    fileApi: {
      host: 'https://file-service.example.com',
      endpoints: {
        fileAdmin: '/file/v1/files',
      },
    },
  } as ConfigState;

  beforeEach(() => {
    jest.spyOn(axios, 'create').mockReturnValue(httpMock as unknown as AxiosInstance);
    deleteMock.mockResolvedValue({ data: { deleted: true } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('deletes multiple files using a comma-separated query string', async () => {
    const api = new FileApi(config, 'token');

    await api.deleteFiles(['file-1', 'file 2']);

    expect(deleteMock).toHaveBeenCalledWith('/file/v1/files?files=file-1,file%202');
  });
});
