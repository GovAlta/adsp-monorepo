import { StatePropsOfLayout } from '@jsonforms/core';
import { AjvProps } from '../../util/layout';
import { TranslateProps } from '@jsonforms/react';
import { ReactNode } from 'react';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {}

export interface CategorizationStepperLayoutReviewRendererProps extends CategorizationStepperLayoutRendererProps {
  navigationFunc?: (index: number) => void;
}

export interface FormStepperComponentProps {
  controlledNav?: number;
  readOnly?: boolean;
}
