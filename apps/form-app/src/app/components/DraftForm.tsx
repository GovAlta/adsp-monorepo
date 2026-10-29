import {
  GoARenderers,
  JsonFormContext,
  enumerators,
  ContextProviderFactory,
  JsonFormRegisterProvider,
  createDefaultAjv,
  User,
  createAutoPopulateMiddleware,
  getAutoPopulatedData,
  mergeAutoPopulatedData,
  NavigationOutcome,
  NavigationTarget,
} from '@abgov/jsonforms-components';
import { GoabBadge } from '@abgov/react-components';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import * as _ from 'lodash';
import { FunctionComponent, useContext, useEffect, useMemo } from 'react';
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

// JsonForms recompiles the whole schema when `ajv` identity changes.
const formAjv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

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
  navigationTarget?: NavigationTarget;
  onNavigationChange?: (outcome: NavigationOutcome) => void;
}

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

const JsonFormsWrapper = ({ definition, data, onChange, readonly, user }) => {
  const enumerators = useContext(JsonFormContext) as enumerators;
  const getFormContextData = enumerators?.getFormContextData;
  const middleware = useMemo(
    () => createAutoPopulateMiddleware(definition.uiSchema, user),
    [definition.uiSchema, user],
  );
  // JsonForms recompiles when `schema` identity changes, so the clone must stay stable.
  const schema = useMemo(
    () => populateDropdown(definition.dataSchema, enumerators),
    [definition.dataSchema, getFormContextData],
  );

  return (
    <JsonFormRegisterProvider defaultRegisters={definition || []}>
      <JsonForms
        readonly={readonly}
        schema={schema}
        uischema={definition.uiSchema}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
        middleware={middleware}
        onChange={onChange}
        ajv={formAjv}
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

const normalizeFilePropertyId = (path: string): string => path.replace(/(\.\d+|\[\d+\])$/, '');
const isIndexedFilePropertyId = (path: string): boolean => /(\.\d+|\[\d+\])$/.test(path);

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
  navigationTarget,
  onNavigationChange,
}) => {
  const user = useSelector((state: AppState) => state.user);
  const resolvedUser = user?.user as User;
  const autoPopulatedData = useMemo(
    () => getAutoPopulatedData(definition.uiSchema, resolvedUser),
    [definition.uiSchema, resolvedUser],
  );
  const populatedData = useMemo(() => mergeAutoPopulatedData(data, autoPopulatedData), [data, autoPopulatedData]);

  useEffect(() => {
    if (autoPopulatedData.length > 0 && !_.isEqual(data ?? {}, populatedData)) {
      onChange({ data: populatedData });
    }
  }, [autoPopulatedData.length, data, onChange, populatedData]);

  const onSubmitFunction = () => {
    onSubmit(form);
  };

  const onSaveFunction = (latestData?: unknown) => {
    onSave({ data: latestData === undefined ? populatedData : latestData });
  };

  const FORM_SUPPORTING_DOCS = 'form-supporting-documents';

  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector(filesSelector);
  const metadata = useSelector(metaDataSelector);

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const uploadFormFile = async (file: File, propertyId: string) => {
    const propertyIdRoot = normalizeFilePropertyId(propertyId);
    const isIndexedProperty = isIndexedFilePropertyId(propertyId);

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

    const latestFiles = (store.getState() as AppState).form?.files || files || {};
    const clonedFiles = { ...latestFiles };

    let targetPropertyId = propertyId;
    if (isIndexedProperty && clonedFiles[targetPropertyId]) {
      const siblingKeys = Object.keys(clonedFiles).filter(
        (key) => key === propertyIdRoot || key.startsWith(`${propertyIdRoot}.`) || key.startsWith(`${propertyIdRoot}[`),
      );
      const maxIndex = siblingKeys.reduce((max, key) => {
        const match = key.match(/(?:\.|\[)(\d+)\]?$/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, -1);
      targetPropertyId = `${propertyIdRoot}.${maxIndex + 1}`;
    }

    clonedFiles[targetPropertyId] = fileMetaData.urn;
    dispatch(formActions.updateFormFiles(clonedFiles));

    // Keep form data in sync with uploaded file refs so backend submit logic can resolve files.
    const latestData = (store.getState() as AppState).form?.data || populatedData || {};
    const nextData = _.cloneDeep(latestData);
    _.set(nextData, targetPropertyId, fileMetaData.urn);
    onChange({ data: nextData });
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
    const latestFiles = (store.getState() as AppState).form?.files || files || {};
    const clonedFiles = { ...latestFiles };
    const propertyId = getKeyByValue(clonedFiles, file.urn);

    await dispatch(deleteFile({ urn: file.urn, propertyId, anonymousApply }));

    if (propertyId) {
      delete clonedFiles[propertyId];
    }
    Object.keys(clonedFiles).forEach((key) => {
      if (clonedFiles[key] === file.urn) {
        delete clonedFiles[key];
      }
    });
    dispatch(formActions.updateFormFiles(clonedFiles));

    // Mirror file removal in form data to prevent stale URN refs.
    const latestData = (store.getState() as AppState).form?.data || populatedData || {};
    const nextData = _.cloneDeep(latestData);
    if (propertyId) {
      _.unset(nextData, propertyId);
    }
    onChange({ data: nextData });
  };

  return (
    <div>
      {!anonymousApply && (
        <SavingIndicator data-saving={saving}>
          <GoabBadge emphasis="subtle" type="information" content="Saving..." />
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
        autoPopulatedData={autoPopulatedData}
        formId={form?.id}
        navigationTarget={navigationTarget}
        onNavigationChange={onNavigationChange}
      >
        <JsonFormsWrapper
          definition={definition}
          data={populatedData}
          onChange={onChange}
          readonly={submitting}
          user={resolvedUser}
        />
      </ContextProvider>
    </div>
  );
};
