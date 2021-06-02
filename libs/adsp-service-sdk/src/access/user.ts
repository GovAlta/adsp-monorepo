import { AdspId } from '../utils';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  tenantId?: AdspId;
  isCore: boolean;
  token: {
    azp: string;
    aud: string;
    iss: string;
    bearer: string;
    [x: string]: unknown;
  };
}
