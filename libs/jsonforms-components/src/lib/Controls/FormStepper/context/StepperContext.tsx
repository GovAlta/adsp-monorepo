import { createContext, ReactNode, useMemo, useReducer, Dispatch, useEffect } from 'react';
import { CategorizationStepperLayoutRendererProps } from '../types';
import { Categorization, deriveLabelForUISchemaElement, isEnabled } from '@jsonforms/core';
import { pickPropertyValues } from '../util/helpers';
import { stepperReducer } from './reducer';
import { StepperContextDataType, CategoryState } from './types';
import { JsonFormStepperDispatch } from './reducer';
import { useJsonForms } from '@jsonforms/react';
import { getIncompletePaths } from './util';

export interface JsonFormsStepperContextProviderProps {
  children: ReactNode;
  StepperProps: CategorizationStepperLayoutRendererProps & {
    // eslint-disable-next-line
    customDispatch?: Dispatch<any> & { activeId?: number } & { withBackReviewBtn?: boolean };
  };
}

export interface JsonFormsStepperContextProps {
  stepperDispatch: JsonFormStepperDispatch;
  selectStepperState: () => StepperContextDataType;
  selectIsDisabled: () => boolean;
  selectIsActive: (id: number) => boolean;
  selectPath: () => string;
  selectCategory: (id: number) => CategoryState;
  goToPage: (id: number, updateCategoryId?: number) => void;
  toggleShowReviewLink: (id: number) => void;
  validatePage: (id: number) => void;
  isProvided?: boolean;
}

const createStepperContextInitData = (
  props: CategorizationStepperLayoutRendererProps & { activeId?: number } & { withBackReviewBtn?: boolean }
): StepperContextDataType => {
  const { uischema, data, schema, ajv, t, visible, path } = props;
  const categorization = uischema as Categorization;
  const valid = ajv.validate(schema, data || {});

  const categories = categorization.elements?.map((c, id) => {
    const scopes = pickPropertyValues(c, 'scope', 'ListWithDetail');
    const incompletePaths = getIncompletePaths(ajv, scopes);

    return {
      id,
      label: deriveLabelForUISchemaElement(c, t) as string,
      scopes,
      isVisited: false,
      isCompleted: incompletePaths?.length === 0,
      isValid: incompletePaths?.length === 0,
      uischema: c,
      showReviewPageLink: props.withBackReviewBtn || false,
      isEnabled: isEnabled(c, data, '', ajv),
      visible,
    };
  });

  const activeId = props?.activeId || 0;

  return {
    categories: categories,
    activeId,
    hasNextButton: true && activeId !== categories?.length,
    hasPrevButton: activeId > 0 && activeId !== categories?.length,
    path,
    isOnReview: activeId === categories?.length,
    isValid: valid === true,
    maxReachedStep: 0,
  };
};

export const JsonFormsStepperContext = createContext<JsonFormsStepperContextProps | undefined>(undefined);

export const JsonFormsStepperContextProvider = ({
  children,
  StepperProps,
}: JsonFormsStepperContextProviderProps): JSX.Element => {
  const ctx = useJsonForms();
  const { schema, ajv } = StepperProps;
  const [stepperState, dispatch] = useReducer(stepperReducer, createStepperContextInitData(StepperProps));
  const stepperDispatch = StepperProps?.customDispatch || dispatch;

  const context = useMemo(() => {
    return {
      isProvided: true,
      stepperDispatch,
      selectStepperState: () => {
        return stepperState;
      },
      selectIsDisabled: () => {
        const category = stepperState.categories?.[stepperState.activeId];
        return category === undefined ? false : !category?.isEnabled;
      },
      selectIsActive: (id: number) => {
        return id === stepperState.activeId;
      },
      selectPath: (): string => {
        return stepperState.path;
      },
      selectCategory: (id: number) => {
        return stepperState.categories[id];
      },
      validatePage: (id: number) => {
        stepperDispatch({
          type: 'update/category',
          payload: { errors: ctx?.core?.errors, id, ajv },
        });
      },
      goToPage: (id: number, updateCategoryId?: number) => {
        ajv.validate(schema, ctx.core?.data || {});

        if (stepperState.isOnReview !== true) {
          for (let i = 0; i < id; i++) {
            stepperDispatch({
              type: 'update/category',
              payload: { errors: ctx?.core?.errors, id: i, ajv },
            });
          }
        }

        stepperDispatch({
          type: 'validate/form',
          payload: { errors: ctx?.core?.errors },
        });
        stepperDispatch({ type: 'page/to/index', payload: { id } });
      },
      toggleShowReviewLink: (id: number) => {
        stepperDispatch({
          type: 'toggle/category/review-link',
          payload: { id },
        });
      },
    };
  }, [stepperDispatch, stepperState, ctx.core?.errors]);

  useEffect(() => {
    if (context?.isProvided === true) {
      /* The block is used to cache the state for the tenant web app review editor  */
      stepperDispatch({
        type: 'update/uischema',
        payload: { state: createStepperContextInitData({ ...StepperProps, activeId: stepperState?.activeId }) },
      });
      context.goToPage(stepperState.maxReachedStep);
      context.goToPage(stepperState.activeId);
    }
  }, [JSON.stringify(StepperProps.uischema), JSON.stringify(StepperProps.schema)]);

  return <JsonFormsStepperContext.Provider value={context}>{children}</JsonFormsStepperContext.Provider>;
};
