import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { compile } from 'handlebars';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService, Subscriber } from '../../notification';
import { FormRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { FormDefinition } from '../types';
import { FormEntity } from './form';

export class FormDefinitionEntity implements FormDefinition {
  id: string;
  name: string;
  description: string;
  anonymousApply: boolean;
  applicantRoles: string[];
  assessorRoles: string[];
  formDraftUrlTemplate: string;
  private urlTemplate: HandlebarsTemplateDelegate<{ id: string }>;

  constructor(public tenantId: AdspId, definition: FormDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.anonymousApply = definition.anonymousApply || false;
    this.applicantRoles = definition.applicantRoles || [];
    this.assessorRoles = definition.assessorRoles || [];
    this.formDraftUrlTemplate = definition.formDraftUrlTemplate;
    this.urlTemplate = compile(definition.formDraftUrlTemplate || '');
  }

  public canApply(user: User): boolean {
    return isAllowedUser(
      user,
      this.tenantId,
      this.anonymousApply ? [FormServiceRoles.IntakeApp, ...this.applicantRoles] : this.applicantRoles
    );
  }

  public async createForm(
    user: User,
    repository: FormRepository,
    notificationService: NotificationService,
    applicantInfo: Omit<Subscriber, 'urn'>
  ): Promise<FormEntity> {
    const id = uuidv4();
    const applicant = await notificationService.subscribe(this.tenantId, id, applicantInfo);
    const formDraftUrl = this.urlTemplate({ id });
    const form = await FormEntity.create(user, repository, this, id, formDraftUrl, applicant);

    return form;
  }
}
