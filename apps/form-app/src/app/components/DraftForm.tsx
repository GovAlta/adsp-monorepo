import {
  GoARenderers,
  JsonFormContext,
  enumerators,
  ContextProviderFactory,
  JsonFormRegisterProvider,
  createDefaultAjv,
  autoPopulateValue,
  User,
} from '@abgov/jsonforms-components';
import { GoabBadge } from '@abgov/react-components';
import {
  ControlElement,
  JsonSchema4,
  JsonSchema7,
  INIT,
  UISchemaElement,
  UPDATE_CORE,
  UPDATE_DATA,
  toDataPath,
} from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import * as _ from 'lodash';
import { FunctionComponent, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import {
  AppDispatch,
  Form,
  FormDefinition,
  ValidationError,
  deleteFile,
  downloadFile,
  filesSelector,
  formActions,
  metaDataSelector,
  uploadFile,
  uploadAnonymousFile,
  AppState,
  store,
} from '../state';

export const ContextProvider = ContextProviderFactory();

export type JsonSchema = JsonSchema4 | JsonSchema7;

interface DraftFormProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
  canSubmit: boolean;
  showSubmit: boolean;
  saving: boolean;
  submitting: boolean;
  anonymousApply?: boolean;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  onSubmit: (form: Form) => void;
  onSave: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
}

const JsonFormsActionType = {
  Init: INIT,
  UpdateCore: UPDATE_CORE,
  UpdateData: UPDATE_DATA,
} as const;

const AUTO_POPULATE_ACTION_TYPES = new Set<string>([JsonFormsActionType.Init, JsonFormsActionType.UpdateCore]);

const shouldAutoPopulate = (actionType: string) => AUTO_POPULATE_ACTION_TYPES.has(actionType);

export const populateDropdown = (schema, enumerators) => {
  const newSchema = JSON.parse(JSON.stringify(schema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '') {
      property[propertyName].enum = enumerators?.getFormContextData(propertyName) as string[];
    }
  });

  return newSchema as JsonSchema;
};

type UISchemaElementWithChildren = UISchemaElement & {
  elements?: UISchemaElement[];
};

interface AutoPopulatedValue {
  path: string;
  value: unknown;
}

const getAutoPopulateControls = (element?: UISchemaElement): ControlElement[] => {
  if (!element) {
    return [];
  }

  const controls =
    element.type === 'Control' && element.options?.autoPopulate ? [element as ControlElement] : [];
  const children = (element as UISchemaElementWithChildren).elements ?? [];

  return [...controls, ...children.flatMap(getAutoPopulateControls)];
};

const getAutoPopulatedData = (definition, user?: User): AutoPopulatedValue[] => {
  if (!user) {
    return [];
  }

  return getAutoPopulateControls(definition.uiSchema)
    .map((uischema) => ({
      path: toDataPath(uischema.scope),
      value: autoPopulateValue(user, { uischema }),
    }))
    .filter(({ path, value }) => Boolean(path) && value !== undefined && value !== null);
};

const mergeMissingData = (data, autoPopulatedData: AutoPopulatedValue[]) => {
  const mergedData = _.cloneDeep(data ?? {});

  for (const { path, value } of autoPopulatedData) {
    if (_.get(mergedData, path) === undefined) {
      _.set(mergedData, path, value);
    }
  }

  return mergedData;
};

const createMiddleware = (definition, user?: User) => (state, action, defaultReducer) => {
  const newState = { ...defaultReducer(state, action) };

  if (!shouldAutoPopulate(action.type)) {
    return newState;
  }

  return {
    ...newState,
    data: mergeMissingData(newState.data, getAutoPopulatedData(definition, user)),
  };
};

const JsonFormsWrapper = ({ definition, data, onChange, readonly }) => {
  const enumerators = useContext(JsonFormContext) as enumerators;
  const user = useSelector((state: AppState) => state.user);

  const middleware = createMiddleware(definition, user?.user as User);

  return (
    <JsonFormRegisterProvider defaultRegisters={definition || []}>
      <JsonForms
        readonly={readonly}
        schema={populateDropdown(definition.dataSchema, enumerators)}
        uischema={definition.uiSchema}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
        middleware={middleware}
        onChange={onChange}
        ajv={createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema)}
      />
    </JsonFormRegisterProvider>
  );
};

const SavingIndicator = styled.div`
  display: flex;
  flex-direction: row-reverse;
  opacity: 0;
  transition: opacity 50ms;

  &[data-saving='true'] {
    opacity: 1;
    transition-duration: 1500ms;
  }
`;

export const DraftForm: FunctionComponent<DraftFormProps> = ({
  definition,
  form,
  data,
  saving,
  submitting,
  anonymousApply,
  onChange,
  onSubmit,
  onSave,
}) => {
  const onSubmitFunction = () => {
    onSubmit(form);
  };

  const onSaveFunction = () => {
    onSave({ data });
  };

  const FORM_SUPPORTING_DOCS = 'form-supporting-documents';

  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector(filesSelector);
  const metadata = useSelector(metaDataSelector);

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const uploadFormFile = async (file: File, propertyId: string) => {
    const clonedFiles = { ...files };
    const propertyIdRoot = propertyId.split('.')[0];

    const fileMetaData =
      anonymousApply === true
        ? (
            await dispatch(
              uploadAnonymousFile({
                typeId: FORM_SUPPORTING_DOCS,
                recordId: form?.urn,
                file,
                propertyId: propertyIdRoot,
              }),
            ).unwrap()
          ).metadata
        : (
            await dispatch(
              uploadFile({
                typeId: FORM_SUPPORTING_DOCS,
                recordId: form.urn,
                file,
                propertyId: propertyIdRoot,
              }),
            ).unwrap()
          ).metadata;

    clonedFiles[propertyId] = fileMetaData.urn;
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  const downloadFormFile = async (file) => {
    const element = document.createElement('a');

    const localFileCache = (store.getState() as AppState).file?.files[file.urn];

    if (!localFileCache) {
      const fileData = await dispatch(downloadFile(file.urn)).unwrap();
      element.href = URL.createObjectURL(new Blob([fileData.data]));
      element.download = fileData.metadata.filename;
    } else {
      element.href = localFileCache;
      element.download = file.filename;
    }

    document.body.appendChild(element);
    element.click();
  };

  const deleteFormFile = async (file) => {
    const clonedFiles = { ...files };
    const propertyId = getKeyByValue(clonedFiles, file.urn);

    await dispatch(deleteFile({ urn: file.urn, propertyId, anonymousApply }));

    delete clonedFiles[propertyId];
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  return (
    <div>
      {!anonymousApply && (
        <SavingIndicator data-saving={saving}>
          <GoabBadge type="information" content="Saving..." icon={false} />
        </SavingIndicator>
      )}

      <ContextProvider
        submit={{
          submitForm: onSubmitFunction,
          saveForm: onSaveFunction,
        }}
        fileManagement={{
          fileList: metadata,
          uploadFile: uploadFormFile,
          downloadFile: downloadFormFile,
          deleteFile: deleteFormFile,
        }}
        formUrl="https://form.adsp-uat.alberta.ca"
      >
        <JsonFormsWrapper definition={definition} data={data} onChange={onChange} readonly={submitting} />
      </ContextProvider>
    </div>
  );
};
