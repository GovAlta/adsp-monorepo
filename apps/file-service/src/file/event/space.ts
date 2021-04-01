import { User, DomainEvent } from '@core-services/core-common';
import { FileSpace } from '../types';

interface FileSpaceEvent extends DomainEvent {
  namespace: 'File';
  space: Omit<FileSpace, 'types'>;
}

interface FileSpaceCreateEvent extends FileSpaceEvent {
  name: 'File Space Created';
  createdBy: string;
}

interface FileSpaceUpdatedEvent extends FileSpaceEvent {
  name: 'File Space Updated';
  updatedBy: string;
}

export const createdFileSpace = (
  space: Omit<FileSpace, 'types'>,
  createdBy: User,
  created: Date
): FileSpaceCreateEvent => ({
  namespace: 'File',
  name: 'File Space Created',
  timestamp: created,
  correlationId: space.id,
  space,
  createdBy: `${createdBy.name} (ID: ${createdBy.id})`,
});

export const updatedFileSpace = (
  space: Omit<FileSpace, 'types'>,
  updatedBy: User,
  updated: Date
): FileSpaceUpdatedEvent => ({
  namespace: 'File',
  name: 'File Space Updated',
  timestamp: updated,
  correlationId: space.id,
  space,
  updatedBy: `${updatedBy.name} (ID: ${updatedBy.id})`,
});
