import { AdspId, assertAdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import * as hasha from 'hasha';
import { FormDefinitionEntity } from '../model';
import { FormRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { Form, FormStatus } from '../types';
import { NotificationService, Subscriber } from '../../notification';
import { FileService } from '../../file';

export class FormEntity implements Form {
  tenantId: AdspId;
  id: string;
  formDraftUrl: string;
  created: Date;
  createdBy: { id: string; name: string };
  locked: Date;
  submitted: Date;
  lastAccessed: Date;
  status: FormStatus;
  data: Record<string, unknown>;
  files: Record<string, AdspId>;

  static async create(
    user: User,
    repository: FormRepository,
    definition: FormDefinitionEntity,
    id: string,
    formDraftUrl: string,
    applicant: Subscriber
  ): Promise<FormEntity> {
    if (!definition.canApply(user)) {
      throw new UnauthorizedUserError('create form', user);
    }

    const form = new FormEntity(repository, definition, applicant, {
      id,
      formDraftUrl,
      created: new Date(),
      createdBy: { id: user.id, name: user.name },
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      status: FormStatus.Draft,
      data: {},
      files: {},
    });

    return await repository.save(form);
  }

  constructor(
    private repository: FormRepository,
    public definition: FormDefinitionEntity,
    public applicant: Subscriber,
    form: Omit<Form, 'definition' | 'applicant'>,
    public hash: string = null
  ) {
    this.tenantId = definition.tenantId;
    this.id = form.id;
    this.formDraftUrl = form.formDraftUrl;
    this.created = form.created;
    this.createdBy = form.createdBy;
    this.locked = form.locked;
    this.submitted = form.submitted;
    this.lastAccessed = form.lastAccessed;
    this.status = form.status;
    this.data = form.data || {};
    this.files = form.files || {};
  }

  canAssess(user: User): boolean {
    return isAllowedUser(user, this.tenantId, this.definition.assessorRoles);
  }

  private async access(_user: User): Promise<FormEntity> {
    if (this.status === FormStatus.Locked) {
      throw new InvalidOperationError('Locked form cannot be read.');
    }

    this.lastAccessed = new Date();
    return await this.repository.save(this);
  }

  async sendCode(user: User, notificationService: NotificationService): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.IntakeApp)) {
      throw new UnauthorizedUserError('send code', user);
    }

    await notificationService.sendCode(this.tenantId, this.applicant);

    return this;
  }

  async accessByCode(user: User, notificationService: NotificationService, code: string): Promise<FormEntity> {
    if (this.status !== FormStatus.Draft) {
      throw new InvalidOperationError('Only draft forms can be accessed by verify code.');
    }

    // When access by code, the user needs to be an intake application.
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.IntakeApp)) {
      throw new UnauthorizedUserError('access form', user);
    }

    // Provided code needs to be valid.
    const verified = await notificationService.verifyCode(this.tenantId, this.applicant, code);
    if (!verified) {
      throw new UnauthorizedError('Provided code could not be verified.');
    }

    return await this.access(user);
  }

  async accessByUser(user: User): Promise<FormEntity> {
    if (
      this.status === FormStatus.Draft &&
      (!isAllowedUser(user, this.tenantId, this.definition.applicantRoles) || user.id !== this.createdBy.id)
    ) {
      throw new UnauthorizedUserError('access draft form', user);
    }

    if (this.status === FormStatus.Submitted && !this.canAssess(user)) {
      throw new UnauthorizedUserError('access submitted form', user);
    }

    return await this.access(user);
  }

  async update(user: User, data?: Record<string, unknown>, files?: Record<string, AdspId>): Promise<FormEntity> {
    if (this.status !== FormStatus.Draft) {
      throw new InvalidOperationError('Cannot update form not in draft.');
    }

    if (!this.definition.canApply(user) || user.id !== this.createdBy.id) {
      throw new UnauthorizedUserError('update form', user);
    }

    if (data) {
      this.data = data;
    }

    if (files) {
      Object.entries(files).forEach(([_key, fileId]) => {
        assertAdspId(fileId, null, 'resource');
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
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin)) {
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

  async submit(user: User): Promise<FormEntity> {
    if (!this.definition.canApply(user) || user.id !== this.createdBy.id) {
      throw new UnauthorizedUserError('update form', user);
    }

    this.status = FormStatus.Submitted;
    this.submitted = new Date();
    // Hash the form data on submit for duplicate detection.
    this.hash = await hasha.async(JSON.stringify(this.data), { algorithm: 'sha1' });

    return await this.repository.save(this);
  }

  async archive(user: User): Promise<FormEntity> {
    if (!isAllowedUser(user, this.tenantId, FormServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('archive form', user);
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

    await notificationService.unsubscribe(this.tenantId, this.applicant.urn);

    const deleted = this.repository.delete(this);
    return deleted;
  }
}
