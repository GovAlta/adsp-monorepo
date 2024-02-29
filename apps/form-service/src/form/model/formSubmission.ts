import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { FormEntity } from '.';
import { FormSubmissionRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { FormDisposition, FormSubmission, FormSubmissionCreatedBy } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class FormSubmissionEntity implements FormSubmission {
  id: string;
  formDefinitionId: string;
  formId: string;
  tenantId: AdspId;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: FormSubmissionCreatedBy;
  updatedBy: string;
  updatedDateTime: Date;
  submissionStatus: string;
  disposition: FormDisposition;
  hash: string;

  static async create(
    user: User,
    repository: FormSubmissionRepository,
    form: FormEntity,
    id: string
  ): Promise<FormSubmissionEntity> {
    const formSubmission = new FormSubmissionEntity(repository, form, {
      id,
      created: new Date(),
      createdBy: { id: uuidv4(), name: user.name },
      updatedBy: user.name,
      updatedDateTime: new Date(),
      formData: form.data,
      formFiles: form.files,
      formDefinitionId: form.definition?.id,
      formId: form.id,
      submissionStatus: '',
      disposition: null,
      hash: form.hash,
    });

    return await repository.save(formSubmission);
  }

  constructor(private repository: FormSubmissionRepository, public form: FormEntity, formSubmission: FormSubmission) {
    this.id = formSubmission.id;
    this.created = formSubmission.created;
    this.createdBy = formSubmission.createdBy;
    this.updatedBy = formSubmission.updatedBy;
    this.updatedDateTime = formSubmission.updatedDateTime;
    this.formData = formSubmission.formData || {};
    this.formFiles = formSubmission.formFiles || {};
    this.formDefinitionId = formSubmission.formDefinitionId || '';
    this.formId = formSubmission.formId || '';
    this.tenantId = form.definition.tenantId;
    this.submissionStatus = formSubmission.submissionStatus || '';
    this.disposition = formSubmission.disposition || null;
    this.hash = formSubmission.hash;
  }

  async delete(user: User): Promise<boolean> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('delete form', user);
    }

    const deleted = this.repository.delete(this);
    return deleted;
  }
}
