import { Service, Directory } from '../types';
import { IsNotEmpty } from 'class-validator';
import { DirectoryRepository } from '../repository';

export class DirectoryEntity implements Directory {
  id: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  services: Service[];
  constructor(private repository: DirectoryRepository, directory: Directory) {
    this.name = directory.name;
    this.services = directory.services;
  }
  static create(repository: DirectoryRepository, directory: Directory) {
    const entity = new DirectoryEntity(repository, directory);
    return repository.save(entity);
  }
  async update(directory) {
    this.name = directory.name;
    this.services = directory.services;
    return this.repository.save(this);
  }
}
