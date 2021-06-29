
import type { User } from '@abgov/adsp-service-sdk';
import { NewOrExisting, Update } from '@core-services/core-common';
import { MissingParamsError, UnauthorizedError, InvalidParamsError } from '../common/errors';
import { NoticeRepository } from '../repository/notice';
import { NoticeApplication, NoticeModeType, isValidNoticeModeType } from '../types';

export class NoticeApplicationEntity {
  id:string;
  message: string;
  tennantServRef: string;
  startDate: Date;
  endDate: Date;
  mode: NoticeModeType;

  constructor(private repository: NoticeRepository, application: NewOrExisting<NoticeApplication>) {
    this.id = application?.id;
    this.message = application.message;
    this.tennantServRef = application.tennantServRef;
    this.startDate = application.startDate;
    this.endDate = application.endDate;
    this.mode = application.mode;
  }

  static create(
    // user: User,
    repository: NoticeRepository,
    application: NewOrExisting<NoticeApplication>
  ): Promise<NoticeApplicationEntity> {
    const entity = new NoticeApplicationEntity(repository, application);
    // if (!entity.canCreate(user)) {
    //   throw new UnauthorizedError('User not authorized to create service status.');
    // }
    return repository.save(entity);
  }

  update(
    // user: User,
    update: Update<NoticeApplication>
  ): Promise<NoticeApplicationEntity> {
    // if (!this.canUpdate(user)) {
    //   throw new UnauthorizedError('User not authorized to update service status.');
    // }
    this.message = update.message ?? this.message;
    this.tennantServRef = update.tennantServRef ?? this.tennantServRef;
    this.startDate = update.startDate ?? this.startDate;
    this.endDate = update.endDate ?? this.endDate;

    if (update.mode && !isValidNoticeModeType(update.mode)) {
      throw new InvalidParamsError('Input notice mode is not allowed.');
    } else {
      this.mode = update.mode ?? this.mode;
    }

    return this.repository.save(this);
  }

  // private canUpdate(user: User): boolean {
  //   // TODO: determine the roles
  //   return true;
  // }

  // private canDelete(user: User): boolean {
  //   // TODO: determine the roles
  //   return true;
  // }

  // private canCreate(user: User): boolean {
  //   // TODO: determine the roles
  //   return true;
  // }
}