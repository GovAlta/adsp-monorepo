import { AbilityBuilder, Ability } from '@casl/ability';
import type { ParametrizedAction, PermissionRule } from '../../types';
export interface CustomAbilityBuilder {
    can(permission: PermissionRule): ReturnType<AbilityBuilder<Ability>['can']>;
    buildParametrizedAction: (parametrizedAction: ParametrizedAction) => string;
    build(): Ability;
}
/**
 * Casl Ability Builder.
 */
export declare const caslAbilityBuilder: () => CustomAbilityBuilder;
//# sourceMappingURL=casl-ability.d.ts.map