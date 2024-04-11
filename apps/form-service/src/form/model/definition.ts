import { AdspId, Channel, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { compile } from 'handlebars';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService, Subscriber } from '../../notification';
import { FormRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { FormDefinition, Disposition, QueueTaskToProcess } from '../types';
import { FormEntity } from './form';

export class FormDefinitionEntity implements FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  applicantRoles: string[];
  assessorRoles: string[];
  clerkRoles: string[];
  dispositionStates: Array<Disposition>;
  submissionRecords: boolean;
  supportTopic: boolean;
  formDraftUrlTemplate: string;
  dataSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  queueTaskToProcess?: QueueTaskToProcess;

  private urlTemplate: HandlebarsTemplateDelegate<{ id: string }>;

  constructor(private validationService: ValidationService, public tenantId: AdspId, definition: FormDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.anonymousApply = definition.anonymousApply || false;
    this.applicantRoles = definition.applicantRoles || [];
    this.assessorRoles = definition.assessorRoles || [];
    this.clerkRoles = definition.clerkRoles || [];
    this.dispositionStates = definition.dispositionStates || [];
    this.submissionRecords = definition.submissionRecords || false;
    this.supportTopic = definition.supportTopic || false;
    this.queueTaskToProcess = definition.queueTaskToProcess;
    this.formDraftUrlTemplate = definition.formDraftUrlTemplate;
    this.urlTemplate = compile(definition.formDraftUrlTemplate || '');
    this.dataSchema = definition.dataSchema || {};
    this.uiSchema = definition.uiSchema || {};
    this.validationService.setSchema(this.id, this.dataSchema);
  }

  public canAccessDefinition(user: User): boolean {
    return isAllowedUser(user, this.tenantId, [
      FormServiceRoles.Admin,
      FormServiceRoles.IntakeApp,
      ...this.applicantRoles,
      ...this.clerkRoles,
    ]);
  }

  public canApply(user: User): boolean {
    return isAllowedUser(
      user,
      this.tenantId,
      this.anonymousApply
        ? [FormServiceRoles.IntakeApp, ...this.applicantRoles, ...this.clerkRoles]
        : [...this.applicantRoles, ...this.clerkRoles]
    );
  }

  public isUserApplicant(user: User): boolean {
    const assistRoles = [FormServiceRoles.IntakeApp, ...this.clerkRoles];

    // User does not have one of the assisted application roles.
    return user && !user.roles.find((role) => assistRoles.includes(role));
  }

  public validateData(context: string, data: Record<string, unknown>) {
    return this.validationService.validate(context, this.id, data);
  }

  public async createForm(
    user: User,
    repository: FormRepository,
    notificationService: NotificationService,
    applicantInfo?: Omit<Subscriber, 'urn'>
  ): Promise<FormEntity> {
    if (!this.canApply(user)) {
      throw new UnauthorizedUserError('create form', user);
    }

    if (this.isUserApplicant(user)) {
      // In case where user is the applicant, the userId of the applicant must match the user's own ID.
      applicantInfo = {
        channels: [{ channel: Channel.email, address: user.email }],
        ...applicantInfo,
        userId: user.id,
      };
    }

    const id = uuidv4();
    // If applicant information is provided, then create a subscriber to keep that applicant updated;
    // Otherwise, the form is anonymous and it will be up to the consuming app to support connecting the
    // original person to the application.
    const applicant = applicantInfo
      ? await notificationService.subscribe(this.tenantId, this, id, applicantInfo)
      : null;

    const formDraftUrl = this.urlTemplate({ id });
    const form = await FormEntity.create(user, repository, this, id, formDraftUrl, applicant);

    return form;
  }
}
