import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidValueError } from '@core-services/core-common';
import { v4 as uuidv4 } from 'uuid';
import { FormSubmissionRepository } from '../repository';
import { DirectoryServiceRoles, FormServiceRoles } from '../roles';
import { FormDisposition, FormSubmission, SecurityClassificationType } from '../types';
import { FormEntity } from './form';
import { FormDefinitionEntity } from './definition';

export class FormSubmissionEntity implements FormSubmission {
  id: string;
  formDefinitionId: string;
  formDefinitionRevision: number;
  formId: string;
  tenantId: AdspId;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: { id: string; name: string };
  updatedBy: { id: string; name: string };
  updated: Date;
  submissionStatus: string;
  disposition: FormDisposition;
  hash: string;
  securityClassification: SecurityClassificationType;
  dryRun: boolean;

  get formSubmissionUrn() {
    const urn = `urn:ads:platform:form-service:v1:/forms/${this.formId}${this.id ? `/submissions/${this.id}` : ''}`;
    return urn;
  }

  static async create(
    user: User,
    repository: FormSubmissionRepository,
    form: FormEntity,
    id: string
  ): Promise<FormSubmissionEntity> {
    const formSubmission = new FormSubmissionEntity(
      repository,
      form.tenantId,
      {
        id,
        created: new Date(),
        createdBy: { id: user.id, name: user.name },
        updatedBy: { id: user.id, name: user.name },
        updated: new Date(),
        formData: form.data,
        formFiles: form.files,
        formDefinitionId: form.definition.id,
        // Revision is set only when submission is first created, and loaded from the stored record after.
        formDefinitionRevision: form.definition.revision,
        formId: form.id,
        disposition: null,
        hash: form.hash,
        securityClassification: form.securityClassification,
        dryRun: form.dryRun,
      },
      form.definition,
      form
    );

    return await repository.save(formSubmission);
  }

  constructor(
    private repository: FormSubmissionRepository,
    tenantId: AdspId,
    formSubmission: FormSubmission,
    public definition?: FormDefinitionEntity,
    public form?: FormEntity
  ) {
    this.id = formSubmission.id;
    this.created = formSubmission.created;
    this.createdBy = formSubmission.createdBy;
    this.updatedBy = formSubmission.updatedBy;
    this.updated = formSubmission.updated;
    this.formData = formSubmission.formData || {};
    this.formFiles = formSubmission.formFiles || {};
    this.formDefinitionId = formSubmission.formDefinitionId;
    this.formDefinitionRevision = formSubmission.formDefinitionRevision;
    this.formId = formSubmission.formId;
    this.tenantId = tenantId;
    this.submissionStatus = formSubmission.submissionStatus;
    this.disposition = formSubmission.disposition || null;
    this.hash = formSubmission.hash;
    // This is for backwards compatibility, but security classification should be saved against the submission.
    this.securityClassification = formSubmission.securityClassification || form?.securityClassification;
    this.dryRun = formSubmission.dryRun;
  }

  canRead(user: User): boolean {
    return (
      isAllowedUser(user, this.tenantId, [FormServiceRoles.Admin, DirectoryServiceRoles.ResourceResolver], true) ||
      isAllowedUser(user, this.tenantId, this.definition?.assessorRoles || [])
    );
  }

  async delete(user: User): Promise<boolean> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('delete form', user);
    }

    const deleted = this.repository.delete(this);
    return deleted;
  }

  async dispositionSubmission(user: User, status: string, reason?: string): Promise<FormSubmissionEntity> {
    if (
      !isAllowedUser(user, this.tenantId, [FormServiceRoles.Admin, ...(this.definition?.assessorRoles || [])], true)
    ) {
      throw new UnauthorizedUserError('updated form disposition', user);
    }

    const hasStateToUpdate = this.definition?.dispositionStates?.find((states) => states.name === status);
    if (!hasStateToUpdate) {
      throw new InvalidValueError('Status', `Invalid Form Disposition Status for Form Submission ID: ${this.id}`);
    }

    const dispositionedOn = new Date();
    this.disposition = {
      id: uuidv4(),
      reason,
      status,
      date: dispositionedOn,
    };
    this.updated = dispositionedOn;
    this.updatedBy = { id: user.id, name: user.name };

    return await this.repository.save(this);
  }
}
