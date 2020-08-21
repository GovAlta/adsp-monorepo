import { User, DomainEvent } from '@core-services/core-common'
import { FileType } from '../types';

interface FileTypeEvent extends DomainEvent {
  namespace: 'File'
  space: string
  type: FileType
}

interface FileTypeCreateEvent extends FileTypeEvent {
  name: 'File Type Created'
  createdBy: string
}

interface FileTypeUpdatedEvent extends FileTypeEvent {
  name: 'File Type Updated'
  updatedBy: string
}

export const createdFileType = (
  space: string,
  type: FileType,
  createdBy: User,
  created: Date
): FileTypeCreateEvent => ({
  namespace: 'File',
  name: 'File Type Created',
  timestamp: created,
  correlationId: `${space}.${type.id}`,
  space,
  type,
  createdBy: `${createdBy.name} (ID: ${createdBy.id})`
})

export const updatedFileType = (
  space: string,
  type: FileType,
  updatedBy: User,
  updated: Date
): FileTypeUpdatedEvent => ({
  namespace: 'File',
  name: 'File Type Updated',
  timestamp: updated,
  correlationId: `${space}.${type.id}`,
  space,
  type,
  updatedBy: `${updatedBy.name} (ID: ${updatedBy.id})`
})
