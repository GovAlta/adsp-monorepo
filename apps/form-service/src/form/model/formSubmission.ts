import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { FormEntity } from '.';
import { FormSubmissionRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { FormDeposition, FormSubmission } from '../types';

export class FormSubmissionEntity implements FormSubmission {
  id: string;
  formDefinitionId: string;
  formId: string;
  tenantId: AdspId;
  formData: Record<string, unknown>;
  formFiles: Record<string, AdspId>;
  created: Date;
  createdBy: string;
  updatedBy: string;
  updateDateTime: Date;
  submissionStatus: string;
  deposition: FormDeposition;

  static async create(
    user: User,
    repository: FormSubmissionRepository,
    form: FormEntity,
    id: string
  ): Promise<FormSubmissionEntity> {
    const formSubmission = new FormSubmissionEntity(repository, form, {
      id,
      created: new Date(),
      createdBy: user.name,
      updatedBy: user.name,
      updateDateTime: new Date(),
      formData: form.data,
      formFiles: form.files,
      formDefinitionId: form.definition?.id,
      formId: null,
      tenantId: null,
      submissionStatus: null,
      deposition: null,
    });

    return await repository.save(formSubmission);
  }

  constructor(
    private repository: FormSubmissionRepository,
    public form: FormEntity,

    formSubmission: FormSubmission
  ) {
    this.id = formSubmission.id;
    this.created = formSubmission.created;
    this.createdBy = formSubmission.createdBy;
    this.updatedBy = formSubmission.updatedBy;
    this.updateDateTime = formSubmission.updateDateTime;
    this.formData = formSubmission.formData || {};
    this.formFiles = formSubmission.formFiles || {};
    this.formDefinitionId = formSubmission.formDefinitionId || '';
    this.formId = formSubmission.formId || '';
    this.tenantId = form.definition?.tenantId;
    this.submissionStatus = formSubmission.submissionStatus || '';
    this.deposition = formSubmission.deposition || null;
  }

  async delete(user: User): Promise<boolean> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('delete form', user);
    }

    const deleted = this.repository.delete(this);
    return deleted;
  }
}
