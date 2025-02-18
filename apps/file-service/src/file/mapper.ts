import { AdspId, FileType } from '@abgov/adsp-service-sdk';
import { FileEntity, FileTypeEntity } from './model';
import { FileRecord } from './types';

export function mapFileType(entity: FileTypeEntity): FileType {
  return {
    id: entity.id,
    name: entity.name,
    anonymousRead: entity.anonymousRead,
    updateRoles: entity.updateRoles,
    readRoles: entity.readRoles,
    rules: entity?.rules,
  };
}

export function mapFile(apiId: AdspId, entity: FileEntity) {
  const urn = `${apiId}:/files/${entity.id}`;
  return {
    urn,
    id: entity.id,
    filename: entity.filename,
    size: entity.size,
    typeName: entity.type?.name,
    recordId: entity.recordId,
    created: entity.created,
    createdBy: entity.createdBy,
    lastAccessed: entity.lastAccessed,
    scanned: entity.scanned,
    infected: entity.infected,
    mimeType: entity.mimeType,
    digest: entity.digest,
    securityClassification: entity.securityClassification,
    _links: {
      self: { href: urn },
      download: { href: `${urn}/download` },
    },
  };
}
