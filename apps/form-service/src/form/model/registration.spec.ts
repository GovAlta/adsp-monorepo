import { adspId, User } from '@abgov/adsp-service-sdk';
import { RegistrationStatus } from '../types';
import { FormRegistrationEntity, normalizeEmail } from './registration';

describe('FormRegistrationEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const reviewer = { id: 'reviewer-1', name: 'Reviewer' } as User;

  const createRegistration = () =>
    FormRegistrationEntity.create(tenantId, 'medical-intake', {
      firstName: ' Test ',
      lastName: ' User ',
      email: ' Test.User@Gov.AB.ca ',
      data: { profession: 'nurse' },
    });

  describe('normalizeEmail', () => {
    it('trims and lower-cases the address', () => {
      expect(normalizeEmail('  A.B@Example.COM ')).toBe('a.b@example.com');
    });
  });

  describe('create', () => {
    it('creates a pending registration with a generated id and submission time', () => {
      const entity = createRegistration();

      expect(entity.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(entity.tenantId).toBe(tenantId);
      expect(entity.formDefinitionId).toBe('medical-intake');
      expect(entity.status).toBe(RegistrationStatus.Pending);
      expect(entity.submittedAt).toBeInstanceOf(Date);
      expect(entity.reviewedAt).toBeUndefined();
      expect(entity.reviewedBy).toBeUndefined();
    });

    it('normalizes the names and email', () => {
      const entity = createRegistration();

      expect(entity.firstName).toBe('Test');
      expect(entity.lastName).toBe('User');
      expect(entity.email).toBe('test.user@gov.ab.ca');
    });

    it('defaults the additional data to an empty object', () => {
      const entity = FormRegistrationEntity.create(tenantId, 'medical-intake', {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@gov.ab.ca',
      });

      expect(entity.data).toEqual({});
    });
  });

  describe('review', () => {
    it('records the status, reviewer and review time', () => {
      const entity = createRegistration().review(reviewer, RegistrationStatus.Approved);

      expect(entity.status).toBe(RegistrationStatus.Approved);
      expect(entity.reviewedBy).toEqual({ id: 'reviewer-1', name: 'Reviewer' });
      expect(entity.reviewedAt).toBeInstanceOf(Date);
    });

    it.each([RegistrationStatus.Approved, RegistrationStatus.Denied])(
      'throws a conflict when the registration is already %s',
      (status) => {
        const entity = createRegistration().review(reviewer, status);

        expect(() => entity.review(reviewer, RegistrationStatus.Approved)).toThrow(
          expect.objectContaining({ extra: expect.objectContaining({ statusCode: 409 }) }),
        );
      },
    );
  });
});
