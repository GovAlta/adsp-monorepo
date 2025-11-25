import type { Modules } from '@strapi/types';
import type { MessageDescriptor } from 'react-intl';
/**
 * @description designed to be parsed by formatMessage from react-intl
 * then passed to a Select component.
 */
interface FilterOption {
    value: Modules.EntityService.Params.Filters.Operator.Where;
    label: MessageDescriptor;
}
/**
 * @description these are shared by everyone
 */
declare const BASE_FILTERS: ({
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$eq";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$ne";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$null";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$notNull";
})[];
/**
 * @description typically performed on attributes that are numerical incl. dates.
 */
declare const NUMERIC_FILTERS: ({
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$gt";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$gte";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$lt";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$lte";
})[];
declare const IS_SENSITIVE_FILTERS: ({
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$eqi";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$nei";
})[];
/**
 * @description typically performed on attributes that are strings for partial looking.
 */
declare const CONTAINS_FILTERS: ({
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$contains";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$containsi";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$notContains";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$notContainsi";
})[];
/**
 * @description only used on string attributes.
 */
declare const STRING_PARSE_FILTERS: ({
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$startsWith";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$startsWithi";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$endsWith";
} | {
    label: {
        id: string;
        defaultMessage: string;
    };
    value: "$endsWithi";
})[];
declare const FILTERS_WITH_NO_VALUE: string[];
export { BASE_FILTERS, NUMERIC_FILTERS, IS_SENSITIVE_FILTERS, CONTAINS_FILTERS, STRING_PARSE_FILTERS, FILTERS_WITH_NO_VALUE, };
export type { FilterOption };
