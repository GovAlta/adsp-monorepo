import * as React from 'react';
import { Popover, FlexProps } from '@strapi/design-system';
import { type MessageDescriptor } from 'react-intl';
import { To } from 'react-router-dom';
import { type ValidTourName } from '../Context';
declare const StepCount: ({ tourName, displayedCurrentStep, displayedTourLength, }: {
    tourName: ValidTourName;
    displayedCurrentStep?: number;
    displayedTourLength?: number;
}) => import("react/jsx-runtime").JSX.Element;
declare const GotItAction: ({ onClick }: {
    onClick: () => void;
}) => import("react/jsx-runtime").JSX.Element;
export type DefaultActionsProps = {
    showSkip?: boolean;
    showPrevious?: boolean;
    to?: To;
    onNextStep?: () => void;
    onPreviousStep?: () => void;
    tourName: ValidTourName;
};
declare const DefaultActions: ({ showSkip, showPrevious, to, tourName, onNextStep, onPreviousStep, }: DefaultActionsProps) => import("react/jsx-runtime").JSX.Element;
type WithChildren = {
    children: React.ReactNode;
    id?: never;
    defaultMessage?: never;
};
type WithIntl = {
    children?: undefined;
    id: MessageDescriptor['id'];
    defaultMessage: MessageDescriptor['defaultMessage'];
    withArrow?: boolean;
};
type WithActionsChildren = {
    children: React.ReactNode;
    showStepCount?: boolean;
    showSkip?: boolean;
    showPrevious?: boolean;
};
type WithActionsProps = {
    children?: undefined;
    showStepCount?: boolean;
    showSkip?: boolean;
    showPrevious?: boolean;
};
type StepProps = WithChildren | WithIntl;
type ActionsProps = WithActionsChildren | WithActionsProps;
type Step = {
    Root: React.ForwardRefExoticComponent<React.ComponentProps<typeof Popover.Content> & {
        withArrow?: boolean;
    }>;
    Title: (props: StepProps) => React.ReactNode;
    Content: (props: StepProps & {
        values?: Record<string, React.ReactNode | ((chunks: React.ReactNode) => React.ReactNode)>;
    }) => React.ReactNode;
    Actions: (props: ActionsProps & {
        to?: string;
    } & FlexProps) => React.ReactNode;
};
declare const createStepComponents: (tourName: ValidTourName) => Step;
export type { Step };
export { createStepComponents, GotItAction, StepCount, DefaultActions };
