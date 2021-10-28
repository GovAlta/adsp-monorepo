import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';
import { FormDefinition } from '../types';

export class FormDefinitionEntity implements FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  applicantRoles: string[];
  assessorRoles: string[];

  constructor(public tenantId: AdspId, definition: FormDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.anonymousApply = definition.anonymousApply || false;
    this.applicantRoles = definition.applicantRoles || [];
    this.assessorRoles = definition.assessorRoles || [];
  }

  public canApply(user: User): boolean {
    return isAllowedUser(
      user,
      this.tenantId,
      this.anonymousApply ? [FormServiceRoles.IntakeApp, ...this.applicantRoles] : this.applicantRoles
    );
  }
}
