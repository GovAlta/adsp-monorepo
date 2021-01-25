import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { IsNotEmpty } from 'class-validator';
import * as validFilename from 'valid-filename';
import { User, UnauthorizedError, Update, InvalidOperationError, New, AssertRole } from '@core-services/core-common';
import { FileSpace, FileType, ServiceUserRoles } from '../types';
import { FileSpaceRepository } from '../repository';
import { FileTypeEntity } from './type';

export class FileSpaceEntity implements FileSpace {
  id: string;
  @IsNotEmpty()
  name: string;
  spaceAdminRole: string;
  @IsNotEmpty()
  types: {
    [id: string]: FileTypeEntity
  };

  @AssertRole('create file space', ServiceUserRoles.Admin)
  static create(
    user: User, 
    repository: FileSpaceRepository, 
    space: Omit<FileSpace, 'types'>
  ) {
    const entity = new FileSpaceEntity(repository, {types: {}, ...space});
    return repository.save(entity);
  }

  constructor(
    private repository: FileSpaceRepository,
    space: FileSpace
  ) {
    this.id = space.id;
    this.name = space.name;
    this.spaceAdminRole = space.spaceAdminRole;
    this.types = Object.entries(space.types)
      .reduce((types, [id, type]) => {
        types[id] = new FileTypeEntity(this, type);
        return types;
      }, 
      {}
    );
  }
  
  getPath(storageRoot: string) {
    return path.join(storageRoot, this.id);
  }

  update(user: User, update: Update<FileSpace>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to updated space.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.spaceAdminRole) {
      this.spaceAdminRole = update.spaceAdminRole;
    }

    return this.repository.save(this);
  }

  updateType(user: User, typeId: string, update: Update<FileType>) {

    const type = this.types[typeId];
    type.update(user, update);

    return this.repository.save(this);
  }

  addType(user: User, rootStoragePath: string, typeId: string, type: New<FileType>) {
    const existing = this.types[typeId];
    if (existing) {
      throw new InvalidOperationError(`Type with ID '${typeId}' already exists.`);
    }
    
    if (!validFilename(typeId)) {
      throw new InvalidOperationError(`Type ID '${typeId}' is not valid.`);
    }

    const fileType = FileTypeEntity.create(user, this, typeId, type);
    this.types[typeId] = fileType;

    return this.repository.save(this)
    .then((created) => 
      mkdirp(
        fileType.getPath(rootStoragePath)
      ).then(() => created)
    );
  }

  canAccess(user: User) {
    return user && (
      user.roles.includes(ServiceUserRoles.Admin) ||
      user.roles.includes(this.spaceAdminRole)
    );
  }

  canUpdate(user: User) {
    return user &&  (
      user.roles.includes(ServiceUserRoles.Admin) ||
      user.roles.includes(this.spaceAdminRole)
    );
  }
}
