import axios from 'axios';
import { KeycloakApi } from './api';

jest.mock('axios');

describe('KeycloakApi', () => {
  const get = jest.fn();

  beforeEach(() => {
    get.mockReset();
    (axios.create as jest.Mock).mockReturnValue({ get, interceptors: { request: { use: jest.fn() } } });
  });

  describe('getGroups', () => {
    it('reads subgroups from the children endpoint when only a count is returned', async () => {
      get.mockImplementation((url: string) =>
        Promise.resolve({
          data:
            url === '/autotest/groups'
              ? [{ id: 'g1', name: 'medical', path: '/medical', subGroupCount: 1, subGroups: [] }]
              : [{ id: 'g2', name: 'approvers', path: '/medical/approvers', subGroupCount: 0 }],
        }),
      );

      const groups = await new KeycloakApi('https://keycloak/auth', 'autotest', 'token').getGroups();

      expect(get).toHaveBeenCalledWith('/autotest/groups/g1/children', expect.anything());
      expect(groups).toEqual([
        { id: 'g1', name: 'medical', path: '/medical' },
        { id: 'g2', name: 'approvers', path: '/medical/approvers' },
      ]);
    });

    it('uses inline subgroups without reading the children endpoint', async () => {
      get.mockResolvedValue({
        data: [
          {
            id: 'g1',
            name: 'medical',
            path: '/medical',
            subGroups: [{ id: 'g2', name: 'approvers', path: '/medical/approvers' }],
          },
        ],
      });

      const groups = await new KeycloakApi('https://keycloak/auth', 'autotest', 'token').getGroups();

      expect(get).toHaveBeenCalledTimes(1);
      expect(groups.map(({ path }) => path)).toEqual(['/medical', '/medical/approvers']);
    });

    it('sorts the groups by path', async () => {
      get.mockResolvedValue({
        data: [
          { id: 'b', name: 'nurses', path: '/nurses' },
          { id: 'a', name: 'doctors', path: '/doctors' },
        ],
      });

      const groups = await new KeycloakApi('https://keycloak/auth', 'autotest', 'token').getGroups();

      expect(groups.map(({ path }) => path)).toEqual(['/doctors', '/nurses']);
    });
  });
});
