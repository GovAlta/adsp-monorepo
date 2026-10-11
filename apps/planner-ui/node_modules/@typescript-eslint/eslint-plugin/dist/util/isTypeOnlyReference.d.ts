import type { ScopeVariable } from '@typescript-eslint/scope-manager';
import type { TSESLint } from '@typescript-eslint/utils';
export declare function isMergedTypeValueVariable(variable: ScopeVariable): boolean;
export declare function isTypeOnlyReference(variable: ScopeVariable, ref: TSESLint.Scope.Reference): boolean;
