import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidValueError } from '@core-services/core-common';
import { v4 as uuidv4 } from 'uuid';
import { FormSubmissionRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { FormDisposition, FormSubmission } from '../types';
import { FormEntity } from './form';

export class FormSubmissionEntity implements FormSubmission {
  id: string;
  formDefinitionId: string;
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
        formDefinitionId: form.definition?.id,
        formId: form.id,
        disposition: null,
        hash: form.hash,
      },
      form
    );

    return await repository.save(formSubmission);
  }

  constructor(
    private repository: FormSubmissionRepository,
    tenantId: AdspId,
    formSubmission: FormSubmission,
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
    this.formId = formSubmission.formId;
    this.tenantId = tenantId;
    this.submissionStatus = formSubmission.submissionStatus;
    this.disposition = formSubmission.disposition || null;
    this.hash = formSubmission.hash;
  }

  canRead(user: User): boolean {
    return (
      isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true) ||
      isAllowedUser(user, this.tenantId, this.form?.definition?.assessorRoles || [])
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
      !isAllowedUser(
        user,
        this.tenantId,
        [FormServiceRoles.Admin, ...(this.form?.definition?.assessorRoles || [])],
        true
      )
    ) {
      throw new UnauthorizedUserError('updated form disposition', user);
    }

    const hasStateToUpdate = this.form?.definition?.dispositionStates?.find((states) => states.name === status);
    if (!hasStateToUpdate) {
      throw new InvalidValueError('Status', `Invalid Form Disposition Status for Form Submission ID: ${this.id}`);
    }

    this.disposition = {
      id: uuidv4(),
      reason,
      status,
      date: new Date(),
    };

    return await this.repository.save(this);
  }
}
