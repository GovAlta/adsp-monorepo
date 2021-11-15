import type { AdspId } from '@abgov/adsp-service-sdk';
import type { Namespace } from '../types';
import type { ValuesRepository } from '../repository';
import { ValueDefinitionEntity } from './definition';
import { ValidationService } from '@core-services/core-common';

// TODO: Anemic entity?

export class NamespaceEntity implements Namespace {
  public name: string;
  public description: string;
  public definitions: { [name: string]: ValueDefinitionEntity };

  constructor(
    public validationService: ValidationService,
    public repository: ValuesRepository,
    namespace: Namespace,
    public tenantId: AdspId = null
  ) {
    this.name = namespace.name;
    this.description = namespace.description;
    this.definitions = Object.entries(namespace.definitions || {}).reduce(
      (defs, [name, definition]) => ({
        ...defs,
        [name]: new ValueDefinitionEntity(this, definition),
      }),
      {}
    );
  }
}
