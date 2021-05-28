import { Service, Directory } from '../types';
import { IsNotEmpty } from 'class-validator';
import { DirectoryRepository } from '../repository';

export class DirectoryEntity implements Directory {
  _id: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  services: Service[];
  constructor(private repository: DirectoryRepository, directory: Directory) {
    this._id = directory._id;
    this.name = directory.name;
    this.services = directory.services;
  }
  static create(repository: DirectoryRepository, directory: Directory) {
    const entity = new DirectoryEntity(repository, directory);
    return repository.save(entity);
  }
  update(directory) {
    this.name = directory.name;
    this.services = directory.services;
    return this.repository.save(this);
  }

  delete() {
    return this.repository.delete(this);
  }
}
