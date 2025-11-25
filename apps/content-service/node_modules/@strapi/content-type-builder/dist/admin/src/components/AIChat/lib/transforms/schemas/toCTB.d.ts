import { Schema } from '../../types/schema';
import type { ContentType, Component, AnyAttribute } from '../../../../../types';
/**
 * Transform attributes from Chat format to CTB format
 * Also performs a diff to determine the status of each attribute
 */
export declare const transformAttributesFromChatToCTB: ({ action, attributes }: Schema, oldSchema?: ContentType | Component) => AnyAttribute[];
/**
 * Transform schema format
 *  AI chat -> CTB
 *
 * The AI chat returns a simplified format, and this layer transforms it to be compatible with the CTB reducer.
 *
 * We need to keep track of which changes have been made
 */
export declare const transformChatToCTB: (schema: Schema, oldSchema?: ContentType | Component) => ContentType | Component;
