import { AdspId, Channel, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { compile } from 'handlebars';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService, Subscriber } from '../../notification';
import { CalendarService } from '../calendar';
import { FormRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { FormDefinition, Disposition, QueueTaskToProcess, SecurityClassificationType } from '../types';
import { FormEntity } from './form';

export class FormDefinitionEntity implements FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  oneFormPerApplicant: boolean;
  applicantRoles: string[];
  assessorRoles: string[];
  clerkRoles: string[];
  dispositionStates: Array<Disposition>;
  submissionRecords: boolean;
  submissionPdfTemplate: string;
  supportTopic: boolean;
  formDraftUrlTemplate: string;
  dataSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  queueTaskToProcess?: QueueTaskToProcess;
  securityClassification?: SecurityClassificationType;
  scheduledIntakes: boolean;
  dryRun: boolean;
  registeredId?: string;

  private urlTemplate: HandlebarsTemplateDelegate<{ id: string }>;

  constructor(
    private validationService: ValidationService,
    private calendarService: CalendarService,
    public tenantId: AdspId,
    definition: FormDefinition,
    public revision?: number
  ) {
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.anonymousApply = definition.anonymousApply || false;
    // Defaults to true if the configuration value is not set.
    this.oneFormPerApplicant =
      typeof definition.oneFormPerApplicant === 'boolean' ? definition.oneFormPerApplicant : true;
    this.applicantRoles = definition.applicantRoles || [];
    this.assessorRoles = definition.assessorRoles || [];
    this.clerkRoles = definition.clerkRoles || [];
    this.dispositionStates = definition.dispositionStates || [];
    this.submissionRecords = definition.submissionRecords || false;
    this.submissionPdfTemplate = definition.submissionPdfTemplate || null;
    this.supportTopic = definition.supportTopic || false;
    this.queueTaskToProcess = definition.queueTaskToProcess;
    this.formDraftUrlTemplate = definition.formDraftUrlTemplate;
    this.urlTemplate = compile(definition.formDraftUrlTemplate || '');
    this.dataSchema = definition.dataSchema || {};
    this.uiSchema = definition.uiSchema || {};
    this.validationService.setSchema(`${this.tenantId.resource}:${this.id}`, this.dataSchema);
    this.securityClassification = definition?.securityClassification;
    this.scheduledIntakes = definition?.scheduledIntakes || false;
    this.registeredId = definition?.registeredId || null;
  }

  public canAccessDefinition(user: User): boolean {
    return (
      this.anonymousApply ||
      isAllowedUser(user, this.tenantId, [
        FormServiceRoles.Admin,
        FormServiceRoles.IntakeApp,
        ...this.applicantRoles,
        ...this.clerkRoles,
      ])
    );
  }

  public async canApply(user: User, dryRun?: boolean): Promise<boolean> {
    const passesIntakeCheck = await this.checkScheduledIntakes(user, dryRun);
    if (!passesIntakeCheck) {
      return false;
    }

    return isAllowedUser(
      user,
      this.tenantId,
      this.anonymousApply
        ? [FormServiceRoles.IntakeApp, ...this.applicantRoles, ...this.clerkRoles]
        : [...this.applicantRoles, ...this.clerkRoles],
      true
    );
  }

  public async checkScheduledIntakes(user: User, dryRun?: boolean): Promise<boolean> {
    // If this form definition requires scheduled intakes, and there is no current intake, then return false.

    if (this.scheduledIntakes && !dryRun && !isAllowedUser(user, this.tenantId, FormServiceRoles.Tester, true)) {
      const intake = await this.calendarService.getScheduledIntake(this);

      if (!intake || intake?.isUpcoming) {
        return false;
      }
    }

    return true;
  }

  public isUserApplicant(user: User): boolean {
    const assistRoles = [FormServiceRoles.IntakeApp, ...this.clerkRoles];

    // User does not have one of the assisted application roles.
    return user && !user.roles.find((role) => assistRoles.includes(role));
  }

  public validateData(context: string, data: Record<string, unknown>) {
    return this.validationService.validate(context, `${this.tenantId.resource}:${this.id}`, data);
  }

  public async createForm(
    user: User,
    repository: FormRepository,
    notificationService: NotificationService,
    dryRun?: boolean,
    applicantInfo?: Omit<Subscriber, 'urn'>
  ): Promise<FormEntity> {
    if (!(await this.canApply(user, dryRun))) {
      throw new UnauthorizedUserError('create form', user);
    }

    // Update user applicant if applicant info is provided or if the form is on per applicant (for backwards compatibility).
    // This means that form definitions that permit multiple forms allow a unset applicant (i.e. no notifications).
    if (this.isUserApplicant(user) && (applicantInfo || this.oneFormPerApplicant)) {
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
    const form = await FormEntity.create(user, repository, this, id, formDraftUrl, applicant, dryRun);

    return form;
  }
}
