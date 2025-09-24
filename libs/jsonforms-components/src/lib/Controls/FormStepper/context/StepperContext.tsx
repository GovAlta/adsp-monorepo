import { createContext, ReactNode, useMemo, useReducer, Dispatch, useEffect } from 'react';
import { CategorizationStepperLayoutRendererProps } from '../types';
import { Categorization, JsonSchema7, deriveLabelForUISchemaElement, isEnabled, isVisible } from '@jsonforms/core';
import { pickPropertyValues } from '../util/helpers';
import { stepperReducer } from './reducer';
import { StepperContextDataType, CategoryState } from './types';
import { JsonFormStepperDispatch } from './reducer';
import { useJsonForms } from '@jsonforms/react';

import { hasDataInScopes, getIncompletePaths, getIsVisitFromLocalStorage, saveIsVisitFromLocalStorage } from './util';
import { getPageCompletionStatus } from './util';
import { JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { JSONSchema7 } from 'json-schema';


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
  goToTableOfContext: () => void;
  toggleShowReviewLink: (id: number) => void;
  validatePage: (id: number) => void;
  selectNumberOfCompletedCategories: () => number;
  isProvided?: boolean;
}

const createStepperContextInitData = (
  props: CategorizationStepperLayoutRendererProps & { activeId?: number } & { withBackReviewBtn?: boolean }
): StepperContextDataType => {
  const { uischema, data, schema, ajv, t, path } = props;
  const categorization = uischema as Categorization;
  const valid = ajv.validate(schema, data || {});
  const isPage = uischema?.options?.variant === 'pages';
  const isCacheStatus = uischema.options?.cacheStatus;
    //const stepperDispatch = props?.customDispatch || dispatch;
  /* istanbul ignore next */
  const cachedStatus = (isCacheStatus && getIsVisitFromLocalStorage()) || [];
  ajv.validate(schema, data);

  const categories = categorization.elements?.map((c, id) => {
    const scopes = pickPropertyValues(c, 'scope', 'ListWithDetail');
    const incompletePaths = getIncompletePaths(ajv, schema, data, scopes);
    const hasAnyData = hasDataInScopes(data, scopes);
    const isVisited = isCacheStatus ? cachedStatus.at(id) : hasAnyData;
    const isCompleted = isVisited && incompletePaths.length === 0;
    const isValid = isCompleted;
    const result = getPageCompletionStatus(c as unknown as JSONSchema7, data, ajv.errors);

    return {
      id,
      label: deriveLabelForUISchemaElement(c, t) as string,
      scopes,
      /* istanbul ignore next */
      isVisited: isVisited, //result.hasAnyData,
      isCompleted: incompletePaths?.length === 0,
      isValid: incompletePaths?.length === 0,
      uischema: c,
      showReviewPageLink: props.withBackReviewBtn || false,
      isEnabled: isEnabled(c, data, '', ajv),
      visible: isVisible(c, data, '', ajv),
    };
  });

  const activeId = props?.activeId || (isPage ? categories.length + 1 : 0);

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
  /* istanbul ignore next */
  const { schema, ajv, data, uischema } = StepperProps;
  const [stepperState, dispatch] = useReducer(stepperReducer, createStepperContextInitData(StepperProps));
  const stepperDispatch = StepperProps?.customDispatch || dispatch;
  const isCacheStatus = uischema.options?.cacheStatus;

  const context = useMemo(() => {
    return {
      isProvided: true,
      stepperDispatch,
      selectStepperState: () => {
        return {
          ...stepperState,
          categories: stepperState.categories?.map((c) => {
            return {
              ...c,
              visible: c?.uischema && isVisible(c.uischema, data, '', ajv),
              isEnabled: c?.uischema && isEnabled(c.uischema, data, '', ajv),
            };
          }),
        };
      },
      selectIsDisabled: () => {
        const category = stepperState.categories?.[stepperState.activeId];
        return category === undefined ? false : !category?.isEnabled;
      },
      selectNumberOfCompletedCategories: (): number => {
        return stepperState?.categories.reduce(
          (acc, cat) =>
            acc +
            (cat.isValid &&
            cat.isCompleted &&
            cat.isVisited &&
            cat?.uischema &&
            cat?.uischema &&
            isVisible(cat.uischema, data, '', ajv)
              ? 1
              : 0),
          0
        );
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
      goToTableOfContext: () => {
        stepperDispatch({ type: 'page/to/index', payload: { id: stepperState.categories.length + 1 } });
      },
      validatePage: (id: number) => {
        stepperDispatch({
          type: 'update/category',
          payload: { errors: ctx?.core?.errors, id, ajv, schema, data },
        });
      },
      goToPage: (id: number) => {
        ajv.validate(schema, ctx.core?.data || {});

        if (stepperState.isOnReview !== true) {
          for (let i = 0; i < id; i++) {
            stepperDispatch({
              type: 'update/category',
              payload: { errors: ctx?.core?.errors, id: i, ajv, schema, data },
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
  }, [stepperDispatch, stepperState, ctx.core?.errors, ajv, schema, data]);

  /* istanbul ignore next */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isCacheStatus) {
        saveIsVisitFromLocalStorage(stepperState?.categories?.map((c) => c?.isVisited as boolean) || []);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stepperState]);

  useEffect(() => {
    if (context?.isProvided === true) {
      /* The block is used to cache the state for the tenant web app review editor  */
      stepperDispatch({
        type: 'update/uischema',
        payload: {
          state: createStepperContextInitData({
            ...StepperProps,
            activeId: Math.min(stepperState?.activeId, stepperState.maxReachedStep),
          }),
        },
      });

      if (stepperState.activeId !== stepperState.categories.length + 1) {
        context.goToPage(stepperState.maxReachedStep);
        context.goToPage(stepperState.activeId);
      }
    }
  }, [JSON.stringify(StepperProps.uischema), JSON.stringify(StepperProps.schema)]);

  return <JsonFormsStepperContext.Provider value={context}>{children}</JsonFormsStepperContext.Provider>;
};
