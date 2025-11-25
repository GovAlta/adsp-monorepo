import * as React from 'react';
import { type InputProps } from '@strapi/admin/strapi-admin';
import { FlexComponent } from '@strapi/design-system';
import { type EditFieldLayout } from '../../../../../hooks/useDocumentLayout';
import { RelationResult } from '../../../../../services/relations';
type RelationPosition = (Pick<RelationResult, 'status' | 'locale'> & {
    before: string;
    end?: never;
}) | {
    end: boolean;
    before?: never;
    status?: never;
    locale?: never;
};
interface Relation extends Pick<RelationResult, 'documentId' | 'id' | 'locale' | 'status'> {
    href: string;
    label: string;
    position?: RelationPosition;
    __temp_key__: string;
    apiData?: {
        documentId: RelationResult['documentId'];
        id: RelationResult['id'];
        locale?: RelationResult['locale'];
        position: RelationPosition;
        isTemporary?: boolean;
    };
}
interface RelationsFieldProps extends Omit<Extract<EditFieldLayout, {
    type: 'relation';
}>, 'size' | 'hint'>, Pick<InputProps, 'hint'> {
}
export interface RelationsFormValue {
    connect?: Relation[];
    disconnect?: Pick<Relation, 'id'>[];
}
declare const FlexWrapper: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").FlexProps<"div">, "ref"> & React.RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | React.RefObject<unknown> | null | undefined;
}, never>> & Omit<FlexComponent, keyof React.Component<any, {}, any>>;
declare const DisconnectButton: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, never>>;
declare const LinkEllipsis: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").LinkProps<React.ElementType<any, keyof React.JSX.IntrinsicElements>>, "ref"> & React.RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | React.RefObject<unknown> | null | undefined;
}, never>> & Omit<(<C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "a">(props: React.PropsWithoutRef<import("@strapi/design-system").LinkProps<C>> & React.RefAttributes<unknown>) => React.ReactNode), keyof React.Component<any, {}, any>>;
declare const MemoizedRelationsField: React.MemoExoticComponent<React.ForwardRefExoticComponent<RelationsFieldProps & React.RefAttributes<HTMLDivElement>>>;
export { MemoizedRelationsField as RelationsInput, FlexWrapper, DisconnectButton, LinkEllipsis };
export type { RelationsFieldProps };
