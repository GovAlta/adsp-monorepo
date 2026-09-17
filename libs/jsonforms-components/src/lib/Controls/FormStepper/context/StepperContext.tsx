import {
  createContext,
  ReactNode,
  useMemo,
  useReducer,
  Dispatch,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { CategorizationStepperLayoutRendererProps } from '../types';
import { Categorization, deriveLabelForUISchemaElement, isEnabled, isVisible } from '@jsonforms/core';
import { pickPropertyValues } from '../util/helpers';
import { stepperReducer } from './reducer';
import { StepperContextDataType, CategoryState } from './types';
import { JsonFormStepperDispatch } from './reducer';
import { JsonSchema7, JsonSchema } from '@jsonforms/core';
import { ErrorObject } from 'ajv';
import { useJsonForms } from '@jsonforms/react';
import { getIsVisitFromLocalStorage, saveIsVisitFromLocalStorage, getVisitedSteps, saveVisitedSteps } from './util';
import { getStepStatus, AutoPopulatedPathValue } from './util';
import { getAutoPopulateControls } from '../../../util/autoPopulate';
import { JsonFormContext } from '../../../Context';
import { StepStatus } from '../../../common/Constants';
import { NavigationOutcome, NavigationTarget, resolveNavigationTarget } from '../util/navigationTarget';
import { isSameStepperState } from './stateEquality';
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
  goToPage: (id: number, targetScope?: string) => void;
  goToTableOfContext: () => void;
  setVisited: (id: number) => void;
  toggleShowReviewLink: (id: number) => void;
  validatePage: (id: number) => void;
  selectNumberOfCompletedCategories: () => number;
  isProvided?: boolean;
}

interface StepperInitOptions {
  // Categories the user has already opened. The init data is recomputed from the current data
  // snapshot on every change, so without this a visited page is re-derived from its data alone —
  // and a page holding nothing but auto-populated values drops back to NotStarted.
  visitedIds?: ReadonlySet<number>;
  // What auto-populate would write, so an edited pre-filled field counts as user activity.
  autoPopulatedValues?: AutoPopulatedPathValue[];
  // Errors JsonForms core already computed for this schema/data. When present, skip a second
  // full-schema ajv.validate which would also overwrite ajv.errors on the shared instance.
  errors?: ErrorObject[] | null;
}

const createStepperContextInitData = (
  props: CategorizationStepperLayoutRendererProps & { activeId?: number } & { withBackReviewBtn?: boolean },
  options?: StepperInitOptions,
): StepperContextDataType => {
  const { uischema, data, schema, ajv, t, path } = props;
  const categorization = uischema as Categorization;
  const coreErrors = options?.errors;
  const valid =
    coreErrors != null ? coreErrors.length === 0 : ajv.validate(schema, data || {}) === true;
  const sourceErrors = coreErrors != null ? coreErrors : ajv.errors;
  const filteredErrors = sourceErrors && sourceErrors.filter((error) => error?.data != null);

  const isPage = uischema?.options?.variant === 'pages';

  //TODO: Determine if cachedStatus is still being used by anything in the library
  //      If not, do a proper clean up.
  const isCacheStatus = uischema.options?.cacheStatus;
  const cachedStatus = (isCacheStatus && getIsVisitFromLocalStorage()) || [];

  const categories = categorization.elements?.map((c, id) => {
    const scopes = pickPropertyValues(c, 'scope', 'ListWithDetail');

    // On first mount nothing is visited, so status is driven by whether the step already holds
    // user-entered data. Auto-populated fields (system-filled from the user profile) are excluded
    // so an unopened page with only auto-populated values stays NotStarted, while a resumed form
    // the user actually filled still shows its saved status. On the recomputes that follow every
    // data change, pages the user has already opened keep their visited state.
    let visited = options?.visitedIds?.has(id) ?? false;
    const autoPopulatedScopes = getAutoPopulateControls(c).map((control) => control.scope);

    const { status, hasRequiredFields } = getStepStatus({
      scopes,
      data,
      errors: filteredErrors ?? [],
      schema,
      visited,
      autoPopulatedScopes,
      autoPopulatedValues: options?.autoPopulatedValues,
    });

    //If the step has all conditional fields, set visited to true so that the step status will be
    //completed to enable form to be saved.
    if (!hasRequiredFields) {
      visited = true;
    }

    return {
      id,
      label: deriveLabelForUISchemaElement(c, t) ?? `Step ${id + 1}`,
      scopes,
      isCompleted: status === StepStatus.COMPLETED || (visited && !hasRequiredFields),
      isValid: status === StepStatus.COMPLETED || (visited && !hasRequiredFields),
      isVisited: [StepStatus.COMPLETED, StepStatus.IN_PROGRESS].includes(status),
      // Navigation is tracked by the reducer, which merges this value forward on every recompute.
      // It starts false so a freshly opened form shows no validation messages until the user has
      // actually worked through a step; deriving it here from data would defeat the point.
      isNavigatedAway: false,
      status,
      uischema: c,
      isEnabled: isEnabled(c, data, '', ajv, undefined),
      visible: isVisible(c, data, '', ajv, undefined),
    };
  });

  const activeId = props?.activeId ?? (isPage ? categories.length + 1 : 0);

  return {
    categories: categories,
    activeId,
    hasNextButton: true && activeId !== categories?.length,
    hasPrevButton: activeId > 0 && activeId !== categories?.length,
    path,
    isOnReview: activeId === categories?.length,
    isValid: valid === true,
    maxReachedStep: 0,
    validationTrigger: 0,
  };
};

export const JsonFormsStepperContext = createContext<JsonFormsStepperContextProps | undefined>(undefined);

const isFormValid = (ajvValid: boolean, emptyRequiredStringErrors: ErrorObject[]): boolean => {
  return ajvValid && emptyRequiredStringErrors.length === 0;
};

export const JsonFormsStepperContextProvider = ({
  children,
  StepperProps,
}: JsonFormsStepperContextProviderProps): JSX.Element => {
  const ctx = useJsonForms();
  /* istanbul ignore next */
  const { schema, ajv, data, uischema } = StepperProps;
  const formCtx = useContext(JsonFormContext);
  const autoPopulatedValues = formCtx?.autoPopulatedData as AutoPopulatedPathValue[] | undefined;
  const formId = formCtx?.formId as string | undefined;
  const navigationTarget = formCtx?.navigationTarget as NavigationTarget | undefined;
  const onNavigationChange = formCtx?.onNavigationChange as ((outcome: NavigationOutcome) => void) | undefined;
  // Steps opened in an earlier session. Seeding these on first mount is what keeps a step the user
  // has been through from dropping back to NotStarted on resume — including the case where they
  // edited an auto-populated field and then restored the original value, which leaves nothing in
  // the data to distinguish it from a step that was never opened.
  const persistedVisitedIds = useMemo(() => new Set(getVisitedSteps(formId) ?? []), [formId]);
  const [stepperState, dispatch] = useReducer(
    stepperReducer,
    createStepperContextInitData(StepperProps, {
      visitedIds: persistedVisitedIds,
      autoPopulatedValues,
      errors: ctx?.core?.errors,
    }),
  );
  const stepperDispatch = StepperProps?.customDispatch || dispatch;
  const isCacheStatus = uischema.options?.cacheStatus;
  const stepperStateRef = useRef(stepperState);
  stepperStateRef.current = stepperState;

  //prevents infinite loop refresh
  // Reading the current values through a ref keeps this callback stable. It used to change identity
  // on every keystroke, which rebuilt the context object and re-rendered every control on the page.
  const validateInputsRef = useRef({ ajv, schema, data, errors: ctx?.core?.errors });
  validateInputsRef.current = { ajv, schema, data, errors: ctx?.core?.errors };

  const doValidatePage = useCallback(
    (id: number) => {
      const { errors, ajv: currentAjv, schema: currentSchema, data: currentData } = validateInputsRef.current;
      stepperDispatch({
        type: 'update/category',
        payload: { errors: errors ?? undefined, id, ajv: currentAjv, schema: currentSchema, data: currentData },
      });
    },
    [stepperDispatch],
  );

  // The snapshot is recomputed whenever data changes, but the result is usually identical. Holding
  // the previous object when the content matches is what keeps the context — and therefore every
  // control subscribed to it — from re-rendering on a keystroke that changed nothing it exposes.
  const snapshotRef = useRef<StepperContextDataType | undefined>(undefined);
  const snapshot = useMemo(() => {
    const emptyRequiredStringErrors = getEmptyRequiredStringErrors(data || {}, schema);
    const categories = stepperState.categories?.map((c) => ({
      ...c,
      visible: c?.uischema ? isVisible(c.uischema, data, '', ajv, undefined) : c.visible,
      isEnabled: c?.uischema ? isEnabled(c.uischema, data, '', ajv, undefined) : c.isEnabled,
    }));
    const computed: StepperContextDataType = {
      ...stepperState,
      isValid: isFormValid(stepperState.isValid, emptyRequiredStringErrors),
      categories,
    };

    const previous = snapshotRef.current;
    if (previous && isSameStepperState(previous, computed)) {
      return previous;
    }

    snapshotRef.current = computed;
    return computed;
  }, [stepperState, data, schema, ajv]);

  const context = useMemo(() => {
    return {
      isProvided: true,
      stepperDispatch,
      selectStepperState: () => snapshot,
      selectIsDisabled: () => {
        const category = snapshot.categories?.[snapshot.activeId];
        return category === undefined ? false : !category?.isEnabled;
      },
      selectNumberOfCompletedCategories: (): number => {
        return snapshot.categories.reduce(
          (acc, cat) =>
            acc +
            (cat.isValid &&
            cat.isCompleted &&
            cat.isVisited &&
            (cat?.uischema?.options?.showInTaskList || cat?.uischema?.options?.showInTaskList === undefined) &&
            cat.visible
              ? 1
              : 0),
          0,
        );
      },
      selectIsActive: (id: number) => {
        return id === snapshot.activeId;
      },
      selectPath: (): string => {
        return snapshot.path;
      },
      selectCategory: (id: number) => {
        return snapshot.categories[id];
      },
      goToTableOfContext: () => {
        stepperDispatch({ type: 'page/to/index', payload: { id: snapshot.categories.length + 1 } });
      },

      validatePage: doValidatePage,
      goToPage: (id: number, targetScope?: string) => {
        stepperDispatch({ type: 'page/to/index', payload: { id, targetScope } });
      },
      setVisited: (id: number) => {
        stepperDispatch({ type: 'set/visited', payload: { id } });
      },
      toggleShowReviewLink: (id: number) => {
        stepperDispatch({
          type: 'toggle/category/review-link',
          payload: { id },
        });
      },
    };
  }, [stepperDispatch, snapshot, doValidatePage]);

  /* istanbul ignore next */
  useEffect(() => {
    stepperDispatch({
      type: 'validate/form',
      payload: { errors: ctx?.core?.errors ?? [] },
    });
    //eslint-disable-next-line
  }, [ctx?.core?.errors]);

  // Persist as the user goes rather than on unload: a draft resumed on another tab, or after a
  // crash or a killed mobile tab, never fires beforeunload and would otherwise lose the visits.
  // The categories array is rebuilt on every data change, so this effect runs on each keystroke —
  // only touch storage when the set has actually grown.
  const lastPersistedVisited = useRef<string | null>(null);

  useEffect(() => {
    const visitedIds = stepperState?.categories?.filter((c) => c.isVisited).map((c) => c.id) ?? [];
    const merged = [...new Set([...persistedVisitedIds, ...visitedIds])].sort((a, b) => a - b);

    if (merged.length === 0) {
      return;
    }

    const serialized = JSON.stringify(merged);
    if (serialized === lastPersistedVisited.current) {
      return;
    }

    lastPersistedVisited.current = serialized;
    saveVisitedSteps(formId, merged);
  }, [formId, persistedVisitedIds, stepperState?.categories]);

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
    //eslint-disable-next-line
  }, [stepperState]);

  const hasSyncedSchema = useRef(false);

  useEffect(() => {
    if (context?.isProvided !== true) {
      return;
    }

    // Init already computed this snapshot. Re-running on mount would stringify-equivalent work
    // and used to dispatch goToPage twice, which incremented validationTrigger for no user action.
    if (!hasSyncedSchema.current) {
      hasSyncedSchema.current = true;
      return;
    }

    const current = stepperStateRef.current;
    const isOnTaskList = current.activeId === current.categories.length + 1;

    stepperDispatch({
      type: 'update/uischema',
      payload: {
        state: createStepperContextInitData(
          {
            ...StepperProps,
            // Leaving activeId out lets init recompute the sentinel from the categories this
            // recompute produced, so a conditional page appearing or disappearing still lands on
            // the task list rather than on the review page.
            activeId: isOnTaskList ? undefined : current.activeId,
          },
          {
            visitedIds: new Set([
              ...persistedVisitedIds,
              ...(current.categories?.filter((c) => c.isVisited).map((c) => c.id) ?? []),
            ]),
            autoPopulatedValues,
            errors: ctx?.core?.errors,
          },
        ),
      },
    });
    // Identity, not JSON.stringify: serializing a 10k-line schema on every keystroke is the stall.
    //eslint-disable-next-line
  }, [StepperProps.uischema, StepperProps.schema, StepperProps.data]);

  const contextRef = useRef(context);
  contextRef.current = context;
  const targetKey = navigationTarget
    ? JSON.stringify([
        navigationTarget.pageId ?? '',
        'scope' in navigationTarget ? navigationTarget.scope : '',
        'instancePath' in navigationTarget ? (navigationTarget.instancePath ?? '') : '',
      ])
    : '';
  const lastAppliedTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!navigationTarget || !targetKey) {
      lastAppliedTarget.current = null;
      return;
    }

    if (lastAppliedTarget.current === targetKey) {
      return;
    }

    const { categories: currentCategories } = contextRef.current.selectStepperState();
    if (!currentCategories.length) {
      return;
    }

    lastAppliedTarget.current = targetKey;
    const resolution = resolveNavigationTarget(currentCategories, navigationTarget);

    if (resolution.outcome.status === 'navigated' && 'scope' in resolution) {
      const saveForm = formCtx?.saveFunction?.get('save-form')?.();
      saveForm?.(StepperProps.data);
      stepperDispatch({
        type: 'page/to/index',
        payload: { id: resolution.index, targetScope: resolution.scope },
      });
    }

    onNavigationChange?.(resolution.outcome);
    // The value-based key intentionally controls request application. Dependency identity changes
    // must not pull a user back to the requested page after they navigate away themselves.
  }, [
    formCtx?.saveFunction,
    navigationTarget,
    onNavigationChange,
    StepperProps.data,
    stepperDispatch,
    stepperState.categories.length,
    targetKey,
  ]);

  return <JsonFormsStepperContext.Provider value={context}>{children}</JsonFormsStepperContext.Provider>;
};

const isSchemaObject = (schema: unknown): schema is JsonSchema7 => {
  return !!schema && typeof schema === 'object' && !Array.isArray(schema);
};

const getObjectData = (data: unknown): Record<string, unknown> => {
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
};

const isRequiredStringSchema = (schema: unknown): schema is JsonSchema7 => {
  return isSchemaObject(schema) && schema.type === 'string';
};

const createRequiredStringError = (
  schema: JsonSchema,
  propertyName: string,
  instancePath: string,
  schemaPath: string,
): ErrorObject =>
  ({
    instancePath: `${instancePath}/${propertyName}`,
    schemaPath: `${schemaPath}/requiredString`,
    keyword: 'requiredString',
    params: { propertyName },
    message: 'is required',
    schema: true,
    parentSchema: schema,
    data: '',
  }) as ErrorObject;

const addEmptyRequiredStringErrors = (
  data: Record<string, unknown>,
  schema: JsonSchema,
  instancePath: string,
  schemaPath: string,
  errors: ErrorObject[],
): void => {
  const required = schema.required ?? [];
  const properties = schema.properties ?? {};

  for (const propertyName of required) {
    const propertySchema = properties[propertyName];

    if (isRequiredStringSchema(propertySchema) && data[propertyName] === '') {
      errors.push(createRequiredStringError(schema, propertyName, instancePath, schemaPath));
    }
  }
};

const collectEmptyRequiredStringErrors = (
  data: unknown,
  schema: JsonSchema,
  instancePath: string,
  schemaPath: string,
  errors: ErrorObject[],
): void => {
  if (!isSchemaObject(schema)) {
    return;
  }

  const objectData = getObjectData(data);
  const properties = schema.properties ?? {};

  addEmptyRequiredStringErrors(objectData, schema, instancePath, schemaPath, errors);

  for (const [propertyName, propertySchema] of Object.entries(properties)) {
    if (!isSchemaObject(propertySchema)) {
      continue;
    }

    collectEmptyRequiredStringErrors(
      objectData[propertyName],
      propertySchema,
      `${instancePath}/${propertyName}`,
      `${schemaPath}/properties/${propertyName}`,
      errors,
    );
  }
};

let lastRequiredStringErrors: { data: unknown; schema: JsonSchema; errors: ErrorObject[] } | undefined;

/**
 * Walks the schema for required strings that are present but empty.
 *
 * The walk is O(schema) and both the stepper context and the host form ask for the same
 * data/schema pair on every change, so the most recent result is retained. Data and schema are
 * replaced rather than mutated on a change, which makes identity a safe key.
 */
export const getEmptyRequiredStringErrors = (data: unknown, schema: JsonSchema): ErrorObject[] => {
  if (lastRequiredStringErrors && lastRequiredStringErrors.data === data && lastRequiredStringErrors.schema === schema) {
    return lastRequiredStringErrors.errors;
  }

  const errors: ErrorObject[] = [];
  collectEmptyRequiredStringErrors(data, schema, '', '#', errors);
  lastRequiredStringErrors = { data, schema, errors };

  return errors;
};
