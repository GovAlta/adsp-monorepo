import axios from 'axios';
import {
  createRegisterApi,
  DataRegisterResponse,
  deleteRegisterApi,
  fetchRegistersApi,
  toRegisterConfigData,
  updateRegisterApi,
} from './dataRegisterApi';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const formApiUrl = 'https://form-service.adsp-dev.gov.ab.ca';
const token = 'tenant-admin-token';
const headers = { headers: { Authorization: `Bearer ${token}` } };

const weekdays: DataRegisterResponse = {
  namespace: 'data-register',
  name: 'weekdays',
  description: 'Days of the week',
  entries: ['Monday', 'Tuesday'],
};

describe('dataRegisterApi', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('toRegisterConfigData', () => {
    it('maps a register to the configuration URN jsonforms resolves registers by', () => {
      const register = toRegisterConfigData(weekdays);

      expect(register.urn).toBe('urn:ads:platform:configuration:v2:/configuration/data-register/weekdays');
    });

    it('leaves spaces in the register name unencoded in the URN', () => {
      const register = toRegisterConfigData({ ...weekdays, name: 'week days' });

      expect(register.urn).toBe('urn:ads:platform:configuration:v2:/configuration/data-register/week days');
    });

    it('maps the entries and description to the register data', () => {
      const register = toRegisterConfigData(weekdays);

      expect(register).toEqual(
        expect.objectContaining({ description: 'Days of the week', data: ['Monday', 'Tuesday'] }),
      );
    });
  });

  describe('fetchRegistersApi', () => {
    it('gets the registers from the form service', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: [weekdays] });

      await fetchRegistersApi(token, formApiUrl);

      expect(axiosMock.get).toHaveBeenCalledWith(`${formApiUrl}/form/v1/registers`, headers);
    });

    it('returns the registers as register config data', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: [weekdays] });

      const registers = await fetchRegistersApi(token, formApiUrl);

      expect(registers).toEqual([toRegisterConfigData(weekdays)]);
    });
  });

  describe('createRegisterApi', () => {
    it('posts the new register to the form service', async () => {
      const request = { name: 'weekdays', description: 'Days of the week', entries: ['Monday', 'Tuesday'] };
      axiosMock.post.mockResolvedValueOnce({ data: weekdays });

      await createRegisterApi(token, formApiUrl, request);

      expect(axiosMock.post).toHaveBeenCalledWith(`${formApiUrl}/form/v1/registers`, request, headers);
    });

    it('returns the created register as register config data', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: weekdays });

      const register = await createRegisterApi(token, formApiUrl, { name: 'weekdays' });

      expect(register).toEqual(toRegisterConfigData(weekdays));
    });
  });

  describe('updateRegisterApi', () => {
    it('patches the register at its encoded name', async () => {
      const request = { entries: ['Monday'] };
      axiosMock.patch.mockResolvedValueOnce({ data: { ...weekdays, name: 'week days' } });

      await updateRegisterApi(token, formApiUrl, 'week days', request);

      expect(axiosMock.patch).toHaveBeenCalledWith(`${formApiUrl}/form/v1/registers/week%20days`, request, headers);
    });

    it('returns the updated register as register config data', async () => {
      axiosMock.patch.mockResolvedValueOnce({ data: weekdays });

      const register = await updateRegisterApi(token, formApiUrl, 'weekdays', { description: 'Weekdays' });

      expect(register).toEqual(toRegisterConfigData(weekdays));
    });
  });

  describe('deleteRegisterApi', () => {
    it('deletes the register at its encoded name', async () => {
      axiosMock.delete.mockResolvedValueOnce({ status: 204 });

      await deleteRegisterApi(token, formApiUrl, 'week days');

      expect(axiosMock.delete).toHaveBeenCalledWith(`${formApiUrl}/form/v1/registers/week%20days`, headers);
    });
  });
});
