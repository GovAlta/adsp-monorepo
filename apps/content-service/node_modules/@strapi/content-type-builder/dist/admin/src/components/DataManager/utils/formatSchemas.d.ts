import { Component, ContentType, AnyAttribute } from '../../../types';
export declare const formatSchema: <TType extends Component | ContentType>(schema: Record<string, any>) => TType;
export declare const toAttributesArray: (attributes: Record<string, any>) => AnyAttribute[];
