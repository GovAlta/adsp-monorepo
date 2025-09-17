import { AdspId, assertAdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import * as hasha from 'hasha';
import { v4 as uuidv4 } from 'uuid';
import { FileService } from '../../file';
import { NotificationService, Subscriber } from '../../notification';
import { QueueTaskService } from '../../task';
import { FormDefinitionEntity } from '../model';
import { FormRepository, FormSubmissionRepository } from '../repository';
import { DirectoryServiceRoles, FormServiceRoles } from '../roles';
import { Form, FormStatus, SecurityClassificationType } from '../types';
import { FormSubmissionEntity } from './formSubmission';
import { PdfService } from '../pdf';

// NOTE: True if form has an applicant and was not created by the applicant user (i.e. created by an intake application under a service account)
// Not True if the form does not include applicant at all, which is the case for 'simple' forms where form is directly submitted.
function isAnonymousApplicant(user: User, applicant?: Subscriber): boolean {
  return !!(user?.roles.includes(FormServiceRoles.IntakeApp) && applicant && applicant.userId !== user.id);
}

export class FormEntity implements Form {
  tenantId: AdspId;
  id: string;
  formDraftUrl: string;
  anonymousApplicant: boolean;
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
  lastAccessed: Date;
  status: FormStatus;
  data: Record<string, unknown>;
  files: Record<string, AdspId>;
  securityClassification: SecurityClassificationType;
  dryRun: boolean;
  registeredId?: string;

  static async create(
    user: User,
    repository: FormRepository,
    definition: FormDefinitionEntity,
    id: string,
    formDraftUrl: string,
    applicant?: Subscriber,
    dryRun?: boolean,
    registeredId?: string
  ): Promise<FormEntity> {
    if (!(await definition.canApply(user, dryRun))) {
      throw new UnauthorizedUserError('create form', user);
    }

    const form = new FormEntity(repository, definition.tenantId, definition, applicant, {
      id,
      formDraftUrl,
      anonymousApplicant: isAnonymousApplicant(user, applicant),
      created: new Date(),
      createdBy: { id: user.id, name: user.name },
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      status: FormStatus.Draft,
      data: {},
      files: {},
      securityClassification: definition.securityClassification,
      dryRun: dryRun,
      registeredId: registeredId,
    });

    return await repository.save(form);
  }

  constructor(
    private repository: FormRepository,
    tenantId: AdspId,
    public definition: FormDefinitionEntity,
    public applicant: Subscriber,
    form: Omit<Form, 'definition' | 'applicant'>,
    public hash: string = null
  ) {
    this.definition = definition;
    this.tenantId = tenantId;
    this.id = form.id;
    this.formDraftUrl = form.formDraftUrl;
    this.anonymousApplicant = form.anonymousApplicant;
    this.created = form.created;
    this.createdBy = form.createdBy;
    this.locked = form.locked;
    this.submitted = form.submitted;
    this.lastAccessed = form.lastAccessed;
    this.status = form.status;
    this.data = form.data || {};
    this.files = form.files || {};
    // This is for backwards compatibility, but security classification should be saved against the form.
    this.securityClassification = form.securityClassification || definition?.securityClassification;
    this.dryRun = form.dryRun;
    this.registeredId = form.registeredId;
  }

  /**
   * Checks if user is allowed to read the form 'metadata' (not including data and files).
   *
   * Note that this is more permissive than accessing the form data. For example, assessors are allowed to read forms
   * even while in draft, but not access the form data.
   *
   * @param {User} user
   * @returns {boolean}
   * @memberof FormEntity
   */
  canRead(user: User): boolean {
    // Admins, intake apps, clerks and assessors are allowed read of the form.
    // Applicants are allowed to read forms they created.
    return (
      isAllowedUser(
        user,
        this.tenantId,
        [FormServiceRoles.Admin, FormServiceRoles.IntakeApp, DirectoryServiceRoles.ResourceResolver],
        true
      ) ||
      isAllowedUser(user, this.tenantId, [
        ...(this.definition?.clerkRoles || []),
        ...(this.definition?.assessorRoles || []),
      ]) ||
      (isAllowedUser(user, this.tenantId, this.definition?.applicantRoles || []) &&
        user.id === this.createdBy.id &&
        this.status !== FormStatus.Archived)
    );
  }

  private async access(_user: User): Promise<FormEntity> {
    if (this.status === FormStatus.Locked) {
      throw new InvalidOperationError('Locked form cannot be read.');
    }

    this.lastAccessed = new Date();
    return await this.repository.save(this);
  }

  async sendCode(user: User, notificationService: NotificationService): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.IntakeApp, true)) {
      throw new UnauthorizedUserError('send code', user);
    }

    if (this.applicant) {
      await notificationService.sendCode(this.tenantId, this.applicant);
    }

    return this;
  }

  async accessByCode(user: User, notificationService: NotificationService, code: string): Promise<FormEntity> {
    if (this.status !== FormStatus.Draft) {
      throw new InvalidOperationError('Only draft forms can be accessed by verify code.');
    }

    // When access by code, the user needs to be an intake application.
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.IntakeApp, true)) {
      throw new UnauthorizedUserError('access form', user);
    }

    // Provided code needs to be valid.
    const verified = this.applicant && (await notificationService.verifyCode(this.tenantId, this.applicant, code));
    if (!verified) {
      throw new UnauthorizedError('Provided code could not be verified.');
    }

    return await this.access(user);
  }

  async accessByUser(user: User): Promise<FormEntity> {
    // Allowed if:
    // 1. User is Form Admin
    // 2. User is Applicant who created the form
    // 3. Form is Draft and user is Clerk
    // 4. Form is Submitted and user is Assessor
    if (
      isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true) ||
      (isAllowedUser(user, this.tenantId, this.definition?.applicantRoles || []) && user.id === this.createdBy.id) ||
      (this.status === FormStatus.Draft && isAllowedUser(user, this.tenantId, this.definition?.clerkRoles || [])) ||
      (this.status === FormStatus.Submitted && isAllowedUser(user, this.tenantId, this.definition?.assessorRoles || []))
    ) {
      return await this.access(user);
    } else {
      throw new UnauthorizedUserError('access submitted form', user);
    }
  }

  async update(
    user: User,
    data?: Record<string, unknown>,
    files?: Record<string, AdspId>,
    dryRun?: boolean
  ): Promise<FormEntity> {
    if (this.status !== FormStatus.Draft) {
      throw new InvalidOperationError('Cannot update form not in draft.');
    }

    if (
      !isAllowedUser(user, this.tenantId, this.definition?.clerkRoles || []) &&
      !((await this.definition?.canApply(user, dryRun)) && user.id === this.createdBy.id)
    ) {
      throw new UnauthorizedUserError('update form', user);
    }

    if (data) {
      this.data = data;
    }

    if (files) {
      Object.entries(files).forEach(([_key, fileId]) => {
        assertAdspId(fileId, null, 'resource');
        if (fileId.service !== 'file-service') {
          throw new InvalidOperationError(`Provided ID is not for a file service resource: ${fileId}`);
        }
      });
      this.files = files;
    }

    return this.repository.save(this);
  }

  async lock(user: User): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('lock form', user);
    }

    if (this.status !== FormStatus.Draft) {
      throw new InvalidOperationError('Can only lock draft forms');
    }

    this.status = FormStatus.Locked;
    this.locked = new Date();
    return await this.repository.save(this);
  }

  async unlock(user: User): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('unlock form', user);
    }

    if (this.status !== FormStatus.Locked) {
      throw new InvalidOperationError('Can only unlock locked forms');
    }

    // Unlock updates last access so that the form is not immediately locked again.
    this.status = FormStatus.Draft;
    this.locked = null;
    this.lastAccessed = new Date();
    return await this.repository.save(this);
  }

  async setToDraft(user: User): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, [FormServiceRoles.Admin, ...(this.definition?.assessorRoles || [])])) {
      throw new UnauthorizedUserError('set to draft form', user);
    }

    if (this.status !== FormStatus.Submitted) {
      throw new InvalidOperationError('Can only set submitted forms to draft');
    }

    this.status = FormStatus.Draft;
    this.lastAccessed = new Date();
    return await this.repository.save(this);
  }

  async submit(
    user: User,
    queueTaskService: QueueTaskService,
    submissionRepository: FormSubmissionRepository,
    pdfService: PdfService,
    dryRun?: boolean
  ): Promise<[FormEntity, FormSubmissionEntity, string]> {
    if (this.status !== FormStatus.Draft) {
      throw new InvalidOperationError('Cannot submit form not in draft.');
    }

    if (
      !isAllowedUser(user, this.tenantId, this.definition?.clerkRoles || []) &&
      !((await this.definition?.canApply(user, dryRun)) && user.id === this.createdBy.id)
    ) {
      throw new UnauthorizedUserError('submit form', user);
    }

    this.definition.validateData('form submission', this.data);

    this.status = FormStatus.Submitted;
    this.submitted = new Date();
    this.securityClassification = this.definition?.securityClassification;
    // Hash the form data on submit for duplicate detection.
    this.hash = await hasha.async(JSON.stringify(this.data), { algorithm: 'sha1' });
    this.dryRun = dryRun;

    const saved = await this.repository.save(this);
    let submission: FormSubmissionEntity = null;

    if (this.definition.submissionRecords) {
      // If configured to create submission records, create a form submission record
      // We need the submissionId so that it is available for updates/lookups of the submission.
      submission = await FormSubmissionEntity.create(user, submissionRepository, this, uuidv4());

      if (saved.definition?.queueTaskToProcess?.queueNameSpace && saved.definition?.queueTaskToProcess?.queueName) {
        queueTaskService.createTask(saved, submission);
      }
    }

    let jobId = null;

    if (this.definition.submissionPdfTemplate) {
      jobId = await pdfService.generateFormPdf(this, submission);
    }

    return [saved, submission, jobId];
  }

  async archive(user: User, notificationService: NotificationService): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('archive form', user);
    }

    if (this.applicant) {
      await notificationService.unsubscribe(this.tenantId, this.applicant.urn, this.id);
    }

    this.status = FormStatus.Archived;
    return await this.repository.save(this);
  }

  async delete(user: User, fileService: FileService, notificationService: NotificationService): Promise<boolean> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('delete form', user);
    }

    // Delete the files linked to this form.
    for (const file of Object.values(this.files)) {
      await fileService.delete(this.tenantId, file);
    }

    if (this.applicant) {
      await notificationService.unsubscribe(this.tenantId, this.applicant.urn, this.id);
    }

    const deleted = this.repository.delete(this);
    return deleted;
  }
}
