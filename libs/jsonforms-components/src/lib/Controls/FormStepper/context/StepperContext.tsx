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
  // eslint-disable-next-line
  StepperProps: CategorizationStepperLayoutRendererProps & { customDispatch?: Dispatch<any> & { activeId?: number } };
}

export interface JsonFormsStepperContextProps {
  stepperDispatch: JsonFormStepperDispatch;
  selectStepperState: () => StepperContextDataType;
  selectIsDisabled: () => boolean;
  selectIsActive: (id: number) => boolean;
  selectPath: () => string;
  selectCategory: (id: number) => CategoryState;
  goToPage: (id: number, updateCategoryId?: number) => void;
  isProvided?: boolean;
}

const createStepperContextInitData = (
  props: CategorizationStepperLayoutRendererProps & { activeId?: number }
): StepperContextDataType => {
  const { uischema, data, schema, ajv, t, visible, path } = props;
  const categorization = uischema as Categorization;
  const valid = ajv.validate(schema, data || {});

  const categories = categorization.elements?.map((c, id) => {
    const scopes = pickPropertyValues(c, 'scope');
    // ListWithDetail path might have conflicts with others. The errors in ListWithDetail will still be caught in the ctx.core.errors
    const incompletePaths = getIncompletePaths(ajv, pickPropertyValues(c, 'scope', 'ListWithDetail'));

    return {
      id,
      label: deriveLabelForUISchemaElement(c, t) as string,
      scopes,
      isVisited: false,
      isCompleted: incompletePaths?.length === 0,
      isValid: incompletePaths?.length === 0,
      uischema: c,
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
        return !stepperState.categories[stepperState.activeId]?.isEnabled;
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
      goToPage: (id: number, updateCategoryId?: number) => {
        ajv.validate(schema, ctx.core?.data || {});

        if (updateCategoryId !== undefined) {
          stepperDispatch({
            type: 'update/category',
            payload: { errors: ctx?.core?.errors, id: updateCategoryId, ajv },
          });
        }

        if (stepperState.isOnReview !== true) {
          stepperDispatch({
            type: 'update/category',
            payload: { errors: ctx?.core?.errors, id: stepperState.activeId, ajv },
          });
        }

        stepperDispatch({
          type: 'validate/form',
          payload: { errors: ctx?.core?.errors },
        });
        stepperDispatch({ type: 'page/to/index', payload: { id } });
      },
    };
  }, [stepperDispatch, stepperState, ctx.core?.errors]);

  useEffect(() => {
    if (context?.isProvided === true) {
      stepperDispatch({
        type: 'update/uischema',
        payload: { state: createStepperContextInitData({ ...StepperProps, activeId: stepperState?.activeId }) },
      });
    }
  }, [JSON.stringify(StepperProps.uischema), JSON.stringify(StepperProps.schema)]);

  return <JsonFormsStepperContext.Provider value={context}>{children}</JsonFormsStepperContext.Provider>;
};
