import { Service, Directory } from '../types';
import { DirectoryRepository } from '../repository';
import { Update } from '@core-services/core-common';

export class DirectoryEntity implements Directory {
  id: string;
  name: string;
  services: Service[];
  constructor(private repository: DirectoryRepository, directory: Directory) {
    this.name = directory.name;
    this.services = directory.services;
  }
  static create(repository: DirectoryRepository, directory: Directory): Promise<DirectoryEntity> {
    const entity = new DirectoryEntity(repository, directory);
    return repository.save(entity);
  }
  update(directory: Update<Directory>): Promise<DirectoryEntity> {
    this.name = directory.name ?? this.name;
    this.services = directory.services ?? this.services;
    return this.repository.save(this);
  }
}
