import { createContext, ReactNode, useMemo, useReducer, Dispatch, useEffect, useCallback } from 'react';
import { CategorizationStepperLayoutRendererProps } from '../types';
import { Categorization, deriveLabelForUISchemaElement, isEnabled, isVisible } from '@jsonforms/core';
import { pickPropertyValues } from '../util/helpers';
import { stepperReducer } from './reducer';
import { StepperContextDataType, CategoryState } from './types';
import { JsonFormStepperDispatch } from './reducer';
import { useJsonForms } from '@jsonforms/react';
import { getIsVisitFromLocalStorage, saveIsVisitFromLocalStorage } from './util';
import { getStepStatus } from './util';
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

  // run validation once, capture errors
  const valid = ajv.validate(schema, data || {});
  const schemaErrors = ajv.errors ?? [];

  const isPage = uischema?.options?.variant === 'pages';
  const isCacheStatus = uischema.options?.cacheStatus;
  const cachedStatus = (isCacheStatus && getIsVisitFromLocalStorage()) || [];

  const categories = categorization.elements?.map((c, id) => {
    const scopes = pickPropertyValues(c, 'scope', 'ListWithDetail');

    const status = getStepStatus({
      scopes,
      data,
      errors: ajv.errors ?? [],
      schema,
    });

    return {
      id,
      label: deriveLabelForUISchemaElement(c, t) ?? `Step ${id + 1}`,
      scopes,
      isCompleted: status === 'Completed',
      isValid: status === 'Completed',
      isVisited: status !== 'NotStarted',
      status,
      uischema: c,
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

  //prevents infinite loop refresh
  const doValidatePage = useCallback(
    (id: number) => {
      stepperDispatch({
        type: 'update/category',
        payload: { errors: ctx?.core?.errors, id, ajv, schema, data },
      });
    },
    [stepperDispatch, ctx?.core?.errors, ajv, schema, data]
  );

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
            (cat?.uischema?.options?.showInTaskList || cat?.uischema?.options?.showInTaskList === undefined) &&
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

      validatePage: doValidatePage,
      goToPage: (id: number) => {
        ajv.validate(schema, ctx.core?.data || {});
        // Only update the current category
        if (!stepperState.isOnReview && id < stepperState.categories.length) {
          stepperDispatch({
            type: 'update/category',
            payload: { errors: ctx?.core?.errors, id, ajv, schema, data },
          });
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
