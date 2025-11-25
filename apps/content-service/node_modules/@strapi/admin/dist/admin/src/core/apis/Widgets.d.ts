/// <reference types="react" />
import { To } from 'react-router-dom';
import { Permission } from '../../../../shared/contracts/shared';
import type { Internal, Utils } from '@strapi/types';
import type { MessageDescriptor } from 'react-intl';
type WidgetUID = Utils.String.Suffix<Internal.Namespace.WithSeparator<Internal.Namespace.Plugin> | Internal.Namespace.WithSeparator<Internal.Namespace.Global>, string>;
type WidgetArgs = {
    icon?: typeof import('@strapi/icons').PuzzlePiece;
    title: MessageDescriptor;
    link?: {
        label: MessageDescriptor;
        href: To;
    };
    component: () => Promise<React.ComponentType>;
    pluginId?: string;
    id: string;
    permissions?: Array<Pick<Permission, 'action'> & Partial<Omit<Permission, 'action'>>>;
    roles?: string[];
};
type WidgetWithUID = Omit<WidgetArgs, 'id' | 'pluginId'> & {
    uid: WidgetUID;
};
type DescriptionReducer = (prev: WidgetArgs[]) => WidgetArgs[];
declare class Widgets {
    widgets: WidgetArgs[];
    constructor();
    private generateUid;
    private checkWidgets;
    register(widgets: WidgetArgs | WidgetArgs[] | DescriptionReducer): void;
    getAll: () => WidgetWithUID[];
}
export { Widgets };
export type { WidgetArgs, WidgetWithUID };
