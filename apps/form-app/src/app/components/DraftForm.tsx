import React, { useMemo, useEffect, useContext, FunctionComponent } from 'react';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '@abgov/jsonforms-components';
import {
  GoARenderers,
  JsonFormContext,
  ContextProviderFactory,
  JsonFormRegisterProvider,
  createDefaultAjv,
} from '@abgov/jsonforms-components';
import { GoABadge } from '@abgov/react-components';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';

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
//import { HistoryBridge } from '@abgov/jsonforms-components';
import { useParams, useNavigate } from 'react-router-dom';

export const ContextProvider = ContextProviderFactory();

export type JsonSchema = JsonSchema4 | JsonSchema7;
function StepperRouterBridge() {
  const ctx = useContext(JsonFormsStepperContext) as JsonFormsStepperContextProps | undefined;
  const navigate = useNavigate();
  const { tenant, definitionId, formId, stepSlug } = useParams<{
    tenant: string;
    definitionId: string;
    formId: string;
    stepSlug?: string;
  }>();

  // helper: labels ➜ slugs
  const slugs = useMemo(() => {
    if (!ctx) return [];
    const { categories } = ctx.selectStepperState();
    return (categories ?? []).map((c) =>
      (c?.label ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
    );
  }, [ctx]);

  // URL -> UI (when you reload or when router changes stepSlug)
  useEffect(() => {
    if (!ctx || !slugs.length) return;

    const { activeId } = ctx.selectStepperState();
    const targetSlug = stepSlug ?? slugs[0];
    const idx = Math.max(0, slugs.indexOf(targetSlug));

    if (idx !== activeId) {
      console.log('[BRIDGE] URL->UI set page', { stepSlug, idx });
      ctx.goToPage(idx);
    }
  }, [ctx, slugs.join('|'), stepSlug]);

  // UI -> URL (when stepper activeId changes)
  useEffect(() => {
    if (!ctx || !slugs.length) return;
    const { activeId, isOnReview } = ctx.selectStepperState();
    const slug = isOnReview ? 'review' : slugs[activeId] ?? slugs[0];
    if (!slug || !tenant || !definitionId || !formId) return;

    const base = `/${tenant}/${definitionId}/${formId}`;
    const expectedPath = `${base}/${slug}`;

    if (window.location.pathname !== expectedPath) {
      console.log('[BRIDGE] UI->URL navigate', { slug, expectedPath });
      navigate(expectedPath, { replace: true });
    }
  }, [ctx, slugs.join('|')]); // `activeId`/`isOnReview` are read from ctx

  return null;
}

interface DraftFormProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
  canSubmit: boolean;
  showSubmit: boolean;
  saving: boolean;
  submitting: boolean;
  anonymousApply?: boolean;
  historySyncBasePath?: string;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  onSubmit: (form: Form) => void;
  onSave: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
}

const populateDropdown = (schema: any, enumsCtx: any) => {
  const newSchema = JSON.parse(JSON.stringify(schema ?? {}));
  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '') {
      property[propertyName].enum = enumsCtx?.getFormContextData(propertyName) as string[];
    }
  });
  return newSchema as JsonSchema;
};

const JsonFormsWrapper = ({
  definition,
  data,
  onChange,
  readonly,
  historySyncBasePath,
}: {
  definition: FormDefinition;
  data: Record<string, unknown>;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  readonly: boolean;
  historySyncBasePath?: string;
}) => {
  const enumsCtx = useContext(JsonFormContext);

  // build a uiSchema with historySync baked in (if you actually need to pass it down)
  const uiSchemaWithHistory = useMemo(() => {
    const src: any = definition?.uiSchema ?? {};
    return {
      ...src,
      options: {
        ...src.options,
        historySync: {
          enabled: true,
          basePath: historySyncBasePath,
          strategy: 'path',
          includeReview: true,
          mode: 'replace',
        },
      },
    };
  }, [definition?.uiSchema, historySyncBasePath]);

  return (
    <JsonFormRegisterProvider>
      <JsonForms
        readonly={readonly}
        schema={populateDropdown(definition?.dataSchema, enumsCtx)}
        // If you need to inject the modified uiSchema, swap to: uischema={uiSchemaWithHistory}
        uischema={uiSchemaWithHistory}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
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
  historySyncBasePath,
  onChange,
  onSubmit,
  onSave,
}) => {
  const onSubmitFunction = () => onSubmit(form);
  const onSaveFunction = () => onSave({ data });

  const FORM_SUPPORTING_DOCS = 'form-supporting-documents';
  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector(filesSelector);
  const metadata = useSelector(metaDataSelector);

  const getKeyByValue = (object: Record<string, string>, value: string) =>
    Object.keys(object).find((key) => object[key] === value);

  // File ops expect "metadata-like" objects ({urn, filename}). Keep your original impls:
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
              })
            ).unwrap()
          ).metadata
        : (
            await dispatch(
              uploadFile({
                typeId: FORM_SUPPORTING_DOCS,
                recordId: form.urn,
                file,
                propertyId: propertyIdRoot,
              })
            ).unwrap()
          ).metadata;

    clonedFiles[propertyId] = fileMetaData.urn;
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  const downloadFormFile = async (file: { urn: string; filename: string }) => {
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

  const deleteFormFile = async (file: { urn: string }) => {
    const clonedFiles = { ...files };
    const propertyId = getKeyByValue(clonedFiles, file.urn);
    await dispatch(deleteFile({ urn: file.urn, propertyId, anonymousApply }));
    if (propertyId) {
      delete clonedFiles[propertyId];
      dispatch(formActions.updateFormFiles(clonedFiles));
    }
  };

  // ---- Type-safe wrappers to satisfy ContextProviderFactory prop types (file: File) => void
  const downloadFormFileCb: (file: File) => void = (file: any) => {
    // context passes a metadata-like object; keep runtime flexible
    if (file && (file as any).urn) void downloadFormFile(file as any);
  };

  const deleteFormFileCb: (file: File) => void = (file: any) => {
    if (file && (file as any).urn) void deleteFormFile(file as any);
  };

  // Compute History basePath from route (if not provided)
  const { tenant, definitionId } = useParams();
  const derivedBasePath =
    historySyncBasePath ?? `/${tenant ?? ''}/${definitionId ?? ''}/${form?.id ?? ''}`.replace(/\/+/g, '/');

  return (
    <div>
      {/* Saving indicator */}
      <SavingIndicator data-saving={saving}>
        <GoABadge type="information" content="Saving..." />
      </SavingIndicator>

      <ContextProvider
        submit={{ submitForm: onSubmitFunction, saveForm: onSaveFunction }}
        fileManagement={{
          fileList: metadata,
          uploadFile: uploadFormFile,
          // wrappers typed as (file: File) => void for the provider:
          downloadFile: downloadFormFileCb,
          deleteFile: deleteFormFileCb,
        }}
        formUrl="https://form.adsp-uat.alberta.ca"
      >
        {/* Keep HistoryBridge here if you want URL <-> step sync from within DraftForm */}
        {/* <HistoryBridge enabled basePath={derivedBasePath} strategy="path" includeReview mode="replace" /> */}
        <StepperRouterBridge />
        <JsonFormsWrapper
          definition={definition}
          data={data}
          onChange={onChange}
          readonly={submitting}
          historySyncBasePath={derivedBasePath}
        />
      </ContextProvider>
    </div>
  );
};
