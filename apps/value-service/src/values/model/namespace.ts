import { IsNotEmpty } from 'class-validator';
import { User, UserRole, Update, AssertRole, UnauthorizedError, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Namespace, ServiceUserRoles, ValueDefinition } from '../types';
import { ValuesRepository } from '../repository';
import { ValueDefinitionEntity } from './valueDefinition';
import { AjvValidationService, ValidationService } from '../validation';

export class NamespaceEntity implements Namespace {
  public validationService: ValidationService;
  @IsNotEmpty()
  public name: string;
  public description: string;
  @IsNotEmpty()
  public definitions: { [name: string]: ValueDefinitionEntity };
  public adminRole: UserRole;

  @AssertRole('create namespace', ServiceUserRoles.Admin)
  static create(
    user: User, 
    repository: ValuesRepository, 
    namespace: Namespace
  ) {
    return repository.save(
      new NamespaceEntity(repository, namespace, true)
    );
  }
  
  constructor(
    private repository: ValuesRepository,
    namespace: Namespace, 
    public isNew = false
  ) {
    this.validationService = new AjvValidationService(namespace.name);
    this.name = namespace.name;
    this.description = namespace.description;
    this.adminRole = namespace.adminRole;
    this.definitions = Object.entries(
      namespace.definitions || {}
    ).reduce(
      (defs, [name, definition]) => 
        ({
          ...defs,
          [name]: new ValueDefinitionEntity(
            this.repository, 
            this.validationService, 
            this.name, 
            definition
          )
        }),
      {}
    );
  }

  update(user: User, update: Update<Namespace>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update namespace.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.description) {
      this.description = update.description;
    }

    if (update.adminRole) {
      this.adminRole = update.adminRole;
    }

    return this.repository.save(this);
  }

  addDefinition(user: User, definition: ValueDefinition) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update namespace.');
    }

    if (!definition.name) {
      throw new InvalidOperationError('Value definition must have a name.')
    }

    if (this.definitions[definition.name]) {
      throw new InvalidOperationError('Value definition already exists.');
    }
    
    const newDefinition = new ValueDefinitionEntity(
      this.repository,
      this.validationService,
      this.name, 
      {
        name: definition.name,
        description: definition.description,
        type: definition.type,
        jsonSchema: definition.jsonSchema,
        readRoles: definition.readRoles || [],
        writeRoles: definition.writeRoles || []
      },
      true
    );

    this.definitions[newDefinition.name] = newDefinition;
    
    return this.repository.saveDefinition(newDefinition);
  }

  updateDefinition(
    user: User, 
    name: string, 
    update: Update<ValueDefinition, 'name'>
  ) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update namespace.');
    }

    const definition = this.definitions[name];
    if (!definition) {
      throw new NotFoundError('value definition', `${this.name}:${name}`);
    }

    definition.update(update);
    
    return this.repository.saveDefinition(definition);
  }

  canAccess(user: User) {
    return user && 
      (user.roles.includes(ServiceUserRoles.Admin) ||
      user.roles.includes(this.adminRole));
  }

  canUpdate(user: User) {
    return user &&
      (user.roles.includes(ServiceUserRoles.Admin) ||
      user.roles.includes(this.adminRole));
  }

  canReadValue(user: User, value: string) {
    return user && 
      user.roles.includes(this.adminRole) ||
      this.definitions[value] && 
      (
        this.definitions[value].readRoles.length < 1 ||
        this.definitions[value].readRoles.find(r => user.roles.includes(r))
      );
  }

  canWriteValue(user: User, value: string) {
    return user && 
      this.definitions[value] && 
      this.definitions[value].writeRoles.find(r => user.roles.includes(r));
  }
}
