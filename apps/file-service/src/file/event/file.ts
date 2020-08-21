import { User, DomainEvent } from '@core-services/core-common';
import { File } from '../types';

interface FileEvent extends DomainEvent {
  namespace: 'File'
  space: string
  type: string
  file: Omit<File, 'storage' | 'deleted'>
}

interface FileCreatedEvent extends FileEvent {
  name: 'File Created'
}

interface FileDeletedEvent extends FileEvent {
  name: 'File Deleted'
  deletedBy: string
}

export const createdFile = (
  space: string,
  type: string,
  file: Omit<File, 'storage' | 'deleted'>
): FileCreatedEvent => ({
  namespace: 'File',
  name: 'File Created',
  timestamp: file.created,
  correlationId: file.id,
  space,
  type,
  file
})

export const deletedFile = (
  space: string,
  type: string,
  file: Omit<File, 'storage' | 'deleted'>,
  deletedBy: User,
  deleted: Date
): FileDeletedEvent => ({
  namespace: 'File',
  name: 'File Deleted',
  timestamp: deleted,
  correlationId: file.id,
  space,
  type,
  file,
  deletedBy: `${deletedBy.name} (ID: ${deletedBy.id})`
})
