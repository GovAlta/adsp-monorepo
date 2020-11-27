import { IsNotEmpty } from 'class-validator';
import { User, UserRole, Update, AssertRole, UnauthorizedError, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { ServiceUserRole } from '../../types';
import { Namespace, EventDefinition } from '../types';
import { EventRepository } from '../repository';
import { EventDefinitionEntity } from './eventDefinition';
import { AjvValidationService, ValidationService } from '../validation';

export class NamespaceEntity implements Namespace {
  public validationService: ValidationService;
  @IsNotEmpty()
  public name: string;
  public description: string;
  @IsNotEmpty()
  public definitions: { [name: string]: EventDefinitionEntity };
  public adminRole: UserRole;

  @AssertRole('create namespace', ServiceUserRole.EventAdmin)
  static create(
    user: User, 
    repository: EventRepository, 
    namespace: Namespace
  ) {
    return repository.save(
      new NamespaceEntity(repository, namespace, true)
    );
  }
  
  constructor(
    private repository: EventRepository,
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
          [name]: new EventDefinitionEntity(
            this.validationService, 
            this.name, 
            {...definition, name}
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

  addDefinition(user: User, definition: EventDefinition) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update namespace.');
    }

    if (!definition.name) {
      throw new InvalidOperationError('Value definition must have a name.')
    }

    if (this.definitions[definition.name]) {
      throw new InvalidOperationError('Value definition already exists.');
    }
    
    const newDefinition = new EventDefinitionEntity(
      this.validationService,
      this.name, 
      {
        name: definition.name,
        description: definition.description,
        payloadSchema: definition.payloadSchema,
        sendRoles: definition.sendRoles
      }
    );

    this.definitions[newDefinition.name] = newDefinition;
    
    return this.repository.save(this)
    .then(result => 
      result.definitions[newDefinition.name]
    );
  }

  updateDefinition(
    user: User, 
    name: string, 
    update: Update<EventDefinition, 'name'>
  ) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update namespace.');
    }

    const definition = this.definitions[name];
    if (!definition) {
      throw new NotFoundError('event definition', `${this.name}:${name}`);
    }

    definition.update(update);
    
    return this.repository.save(this)
    .then(result => 
      result.definitions[name]
    );
  }

  removeDefinition(
    user: User, 
    name: string
  ) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update namespace.');
    }

    const definition = this.definitions[name];
    if (definition) {
      delete this.definitions[name];
    }
    
    return this.repository.save(this)
    .then(() => 
      !!definition
    );
  }

  canAccess(user: User) {
    return user && 
      (user.roles.includes(ServiceUserRole.EventAdmin) ||
      user.roles.includes(this.adminRole));
  }

  canUpdate(user: User) {
    return user &&
      (user.roles.includes(ServiceUserRole.EventAdmin) ||
      user.roles.includes(this.adminRole));
  }
}
