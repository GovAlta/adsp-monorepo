import * as React from 'react';
import { Popover } from '@strapi/design-system';
import { InputProps } from './Form';
import type { Schema } from '@strapi/types';
interface FilterFormData {
    name: string;
    filter: string;
    value?: string;
}
interface FitlersContextValue {
    disabled: boolean;
    onChange: (data: FilterFormData) => void;
    options: Filters.Filter[];
    setOpen: (open: boolean) => void;
}
interface RootProps extends Partial<FitlersContextValue>, Popover.Props {
    children: React.ReactNode;
}
declare const Filters: {
    List: () => import("react/jsx-runtime").JSX.Element | null;
    Popover: ({ zIndex }: {
        zIndex?: number;
    }) => import("react/jsx-runtime").JSX.Element | null;
    Root: ({ children, disabled, onChange, options, onOpenChange, open: openProp, defaultOpen, ...restProps }: RootProps) => import("react/jsx-runtime").JSX.Element;
    Trigger: React.ForwardRefExoticComponent<Filters.TriggerProps & React.RefAttributes<HTMLButtonElement>>;
};
interface MainField {
    name: string;
    type: Schema.Attribute.Kind | 'custom';
}
declare namespace Filters {
    interface Filter {
        input?: React.ComponentType<ValueInputProps>;
        label: string;
        /**
         * the name of the attribute we use to display the actual name e.g. relations
         * are just ids, so we use the mainField to display something meaninginful by
         * looking at the target's schema
         */
        mainField?: MainField;
        name: string;
        operators?: Array<{
            label: string;
            value: string;
        }>;
        options?: Array<{
            label?: string;
            value: string;
        }> | string[];
        type: InputProps['type'] | 'relation' | 'custom';
    }
    interface ValueInputProps extends Omit<Filter, 'label'> {
        ['aria-label']: string;
    }
    type Props = RootProps;
    interface TriggerProps {
        label?: string;
    }
    interface Query {
        filters?: {
            /**
             * Typically, a filter will be:
             * ```ts
             * {
             *  [attributeName]: {
             *    [operator]: value
             *  }
             * }
             * ```
             * However, for relation items it becomes more nested.
             * ```ts
             * {
             *  [attributeName]: {
             *    [relationTargetAttribute]: {
             *     [operator]: value
             *    }
             *  }
             * }
             * ```
             */
            $and?: Array<Record<string, Record<string, string | Record<string, string>>>>;
        };
        page?: number;
    }
}
export { Filters };
