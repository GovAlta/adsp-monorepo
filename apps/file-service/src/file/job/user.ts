import { User } from '@abgov/adsp-service-sdk';


export enum ServiceRoles {
  Admin = 'file-service-admin',
  IntakeApp = 'intake-application',
}

export const jobUser = {
  id: 'form-service-job',
  name: 'form-service-job',
  isCore: true,
  roles: [ServiceRoles.Admin],
} as User;


