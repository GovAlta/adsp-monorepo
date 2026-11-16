import { AdspId, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { FormRegistration, FormRegistrationCreate, RegistrationReviewer, RegistrationStatus } from '../types';

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export class FormRegistrationEntity implements FormRegistration {
  id: string;
  tenantId: AdspId;
  formDefinitionId: string;
  status: RegistrationStatus;
  firstName: string;
  lastName: string;
  email: string;
  data: Record<string, unknown>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: RegistrationReviewer;

  static create(tenantId: AdspId, formDefinitionId: string, request: FormRegistrationCreate): FormRegistrationEntity {
    return new FormRegistrationEntity({
      id: uuidv4(),
      tenantId,
      formDefinitionId,
      status: RegistrationStatus.Pending,
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email: normalizeEmail(request.email),
      data: request.data || {},
      submittedAt: new Date(),
    });
  }

  constructor(values: FormRegistration) {
    Object.assign(this, values);
  }

  review(user: User, status: RegistrationStatus): FormRegistrationEntity {
    if (this.status !== RegistrationStatus.Pending) {
      throw new InvalidOperationError(`Registration has already been ${this.status}.`, {
        statusCode: HttpStatusCodes.CONFLICT,
      });
    }

    this.status = status;
    this.reviewedAt = new Date();
    this.reviewedBy = { id: user.id, name: user.name };
    return this;
  }
}
