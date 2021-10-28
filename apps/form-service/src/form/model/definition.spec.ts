import { adspId, User } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';
import { FormDefinitionEntity } from './definition';

describe('FormDefinitionEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  it('can be created', () => {
    const entity = new FormDefinitionEntity(tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
    });
    expect(entity).toBeTruthy();
  });

  describe('canApply', () => {
    const entity = new FormDefinitionEntity(tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
    });

    it('can return true for user with applicant role', () => {
      const result = entity.canApply({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without applicant role', () => {
      const result = entity.canApply({ tenantId, id: 'tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return true for intake app for anonymous apply definition', () => {
      const anonymousApplyEntity = new FormDefinitionEntity(tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        anonymousApply: true,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
      });
      const result = anonymousApplyEntity.canApply({
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.IntakeApp],
      } as User);
      expect(result).toBe(true);
    });

    it('can return false for intake app for none anonymous apply definition', () => {
      const result = entity.canApply({ tenantId, id: 'tester', roles: [FormServiceRoles.IntakeApp] } as User);
      expect(result).toBe(false);
    });

    it('can return false for core user', () => {
      const result = entity.canApply({ isCore: true, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(false);
    });

    it('can return false for user of different tenant', () => {
      const result = entity.canApply({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        id: 'tester',
        roles: ['test-applicant'],
      } as User);
      expect(result).toBe(false);
    });
  });
});
