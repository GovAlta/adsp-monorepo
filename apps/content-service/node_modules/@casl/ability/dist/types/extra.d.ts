import { Condition } from '@ucast/mongo2js';
import { PureAbility, AnyAbility } from './PureAbility';
import { RuleOf } from './RuleIndex';
import { RawRule } from './RawRule';
import { Rule } from './Rule';
import { AnyObject, SubjectType, ExtractSubjectType } from './types';
export declare type RuleToQueryConverter<T extends AnyAbility> = (rule: RuleOf<T>) => object;
export interface AbilityQuery<T = object> {
    $or?: T[];
    $and?: T[];
}
export declare function rulesToQuery<T extends AnyAbility>(ability: T, action: Parameters<T['rulesFor']>[0], subjectType: ExtractSubjectType<Parameters<T['rulesFor']>[1]>, convert: RuleToQueryConverter<T>): AbilityQuery | null;
export declare function rulesToAST<T extends AnyAbility>(ability: T, action: Parameters<T['rulesFor']>[0], subjectType: ExtractSubjectType<Parameters<T['rulesFor']>[1]>): Condition | null;
export declare function rulesToFields<T extends PureAbility<any, AnyObject>>(ability: T, action: Parameters<T['rulesFor']>[0], subjectType: ExtractSubjectType<Parameters<T['rulesFor']>[1]>): AnyObject;
export declare type GetRuleFields<R extends Rule<any, any>> = (rule: R) => string[];
export interface PermittedFieldsOptions<T extends AnyAbility> {
    fieldsFrom: GetRuleFields<RuleOf<T>>;
}
export declare function permittedFieldsOf<T extends AnyAbility>(ability: T, action: Parameters<T['can']>[0], subject: Parameters<T['can']>[1], options: PermittedFieldsOptions<T>): string[];
export declare type PackRule<T extends RawRule<any, any>> = [
    string,
    string
] | [
    string,
    string,
    T['conditions']
] | [
    string,
    string,
    T['conditions'] | 0,
    1
] | [
    string,
    string,
    T['conditions'] | 0,
    1 | 0,
    string
] | [
    string,
    string,
    T['conditions'] | 0,
    1 | 0,
    string | 0,
    string
];
export declare type PackSubjectType<T extends SubjectType> = (type: T) => string;
export declare function packRules<T extends RawRule<any, any>>(rules: T[], packSubject?: PackSubjectType<T['subject']>): PackRule<T>[];
export declare type UnpackSubjectType<T extends SubjectType> = (type: string) => T;
export declare function unpackRules<T extends RawRule<any, any>>(rules: PackRule<T>[], unpackSubject?: UnpackSubjectType<T['subject']>): T[];
