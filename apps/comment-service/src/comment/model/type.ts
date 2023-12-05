import { AdspId, User, isAllowedUser } from '@abgov/adsp-service-sdk';
import { TopicType } from '../types';
import { ServiceRoles } from '../roles';

export class TopicTypeEntity implements TopicType {
  tenantId: AdspId;
  id: string;
  name: string;
  adminRoles: string[];
  readerRoles: string[];
  commenterRoles: string[];
  securityClassification?: string;

  public constructor(tenantId: AdspId, type: Omit<TopicType, 'tenantId'>) {
    this.tenantId = tenantId;
    this.id = type.id;
    this.name = type.name;
    this.adminRoles = type.adminRoles || [];
    this.readerRoles = type.readerRoles || [];
    this.commenterRoles = type.commenterRoles || [];
    this.securityClassification = type.securityClassification || null;
  }

  public canRead(user: User): boolean {
    return this.canAdmin(user) || this.canComment(user) || isAllowedUser(user, this.tenantId, this.readerRoles);
  }

  public canComment(user: User): boolean {
    return this.canAdmin(user) || isAllowedUser(user, this.tenantId, this.commenterRoles);
  }

  public canAdmin(user: User): boolean {
    return isAllowedUser(user, this.tenantId, [ServiceRoles.Admin, ...this.adminRoles]);
  }
}
