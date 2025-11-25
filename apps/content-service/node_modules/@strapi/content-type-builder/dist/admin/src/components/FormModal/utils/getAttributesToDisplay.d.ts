import type { IconByType } from '../../AttributeIcon';
import type { NestedComponent } from '../../DataManager/utils/retrieveNestedComponents';
import type { Internal } from '@strapi/types';
export declare const getAttributesToDisplay: (dataTarget: string | undefined, targetUid: Internal.UID.Schema, nestedComponents: Array<NestedComponent>) => IconByType[][];
