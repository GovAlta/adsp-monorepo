import { User } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';

export const jobUser = {
  id: 'form-service-job',
  name: 'form-service-job',
  isCore: true,
  roles: [FormServiceRoles.Admin],
} as User;
