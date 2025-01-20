import { Categorization, Category } from '@jsonforms/core';

import { StatePropsOfLayout } from '@jsonforms/core';
import { AjvProps } from '../../util/layout';
import { TranslateProps } from '@jsonforms/react';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {}

export interface CategorizationStepperLayoutReviewRendererProps extends CategorizationStepperLayoutRendererProps {
  navigationFunc?: (index: number) => void;
}

export interface FormStepperComponentProps {
  controlledNav?: number;
  readOnly?: boolean;
}

export type CategorizationElement = Category | Categorization;
