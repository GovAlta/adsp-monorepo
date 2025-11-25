import * as React from 'react';
interface DynamicZoneLabelProps {
    label?: React.ReactNode;
    labelAction?: React.ReactNode;
    name: string;
    numberOfComponents?: number;
    required?: boolean;
    hint?: React.ReactNode;
}
declare const DynamicZoneLabel: ({ hint, label, labelAction, name, numberOfComponents, required, }: DynamicZoneLabelProps) => import("react/jsx-runtime").JSX.Element;
export { DynamicZoneLabel };
export type { DynamicZoneLabelProps };
