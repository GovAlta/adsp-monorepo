import axios from 'axios';
import FormData = require('form-data');
import { createFileService } from './file';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('file', () => {
  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  it('can create file service', () => {
    const service = createFileService({ tokenProvider: tokenProviderMock, directory: directoryMock });
    expect(service).toBeTruthy();
  });

  it('can upload file', async () => {
    const service = createFileService({ tokenProvider: tokenProviderMock, directory: directoryMock });

    const content = Buffer.from([]);
    const file = { id: 'test' };
    directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://file-service'));
    tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
    axiosMock.post.mockResolvedValueOnce({ data: file });
    const result = await service.upload('job1', 'test.pdf', content);
    expect(result).toBe(file);
    expect(axiosMock.post).toHaveBeenCalledWith(
      'https://file-service/file/v1/files',
      expect.any(FormData),
      expect.any(Object)
    );
  });
});
