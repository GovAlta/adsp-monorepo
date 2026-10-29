import { GoAReviewRenderers, ContextProviderFactory } from '@abgov/jsonforms-components';
import { UISchemaElement } from '@jsonforms/core';
import { AppState } from '../state';
import { GoabCallout } from '@abgov/react-components';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  Form,
  FormDefinition,
  metaDataSelector,
  AppDispatch,
  downloadFile,
  downloadFormPdf,
  fileBusySelector,
  filesSelector,
  loadFileMetadata,
  store,
} from '../state';
import { useDispatch, useSelector } from 'react-redux';
import { checkPdfFileSelector, getSocketChannel } from '../state';
import { DownloadLink } from '../containers/DownloadLink';
import { connectPdfStream, disconnectPdfStream } from '../state/pdf.slice';
import { checkPdfFile, checkExistingPdfFile } from '../state/file.slice';
export const ContextProvider = ContextProviderFactory();

interface ApplicationStatusProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
}

const Heading = styled.h2`
  margin-top: var(--goa-space-3xl);
  margin-bottom: var(--goa-space-xl);
`;

export const readOnlyUiSchema = (schema) => {
  const newSchema = JSON.parse(JSON.stringify(schema));
  setReadOnly(newSchema);
  addReadOnly(newSchema.elements);

  return newSchema as UISchemaElement;
};

const addReadOnly = (elements) => {
  Array.isArray(elements) &&
    elements.forEach((element) => {
      setReadOnly(element);
      addReadOnly(element.elements);
    });
};

const setReadOnly = (element) => {
  !element.options && (element.options = {});
  !element.options?.componentProps && (element.options.componentProps = {});
  element.options.componentProps.readOnly = true;
  return element;
};

const normalizeFilePropertyId = (path: string): string => path.replace(/(\.\d+|\[\d+\])$/, '');

const extractFileRefsFromData = (
  value: unknown,
  currentPath = '',
  refs: Record<string, string> = {},
): Record<string, string> => {
  if (typeof value === 'string') {
    if (value.startsWith('urn:ads:platform:file-service:')) {
      refs[currentPath] = value;
    }
    return refs;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      const nextPath = currentPath ? `${currentPath}.${index}` : `${index}`;
      extractFileRefsFromData(entry, nextPath, refs);
    });
    return refs;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      extractFileRefsFromData(entry, nextPath, refs);
    });
  }

  return refs;
};

export const SubmittedForm: FunctionComponent<ApplicationStatusProps> = ({ definition, form, data }) => {
  const dispatch = useDispatch<AppDispatch>();
  const pdfFileExists = useSelector((state: AppState) => checkPdfFileSelector(state) || checkExistingPdfFile(state));
  const attachedFiles = useSelector(filesSelector);
  const fileBusy = useSelector(fileBusySelector);

  const socketChannel = useSelector((state: AppState) => {
    return getSocketChannel(state);
  });

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

  const downloadPDFFile = async (file) => {
    const fileData = await dispatch(downloadFormPdf(file)).unwrap();
    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([fileData.data]));
    element.download = `${form?.definition?.id}.pdf`;
    document.body.appendChild(element);
    element.click();
  };

  const fileQueryUrn = form?.urn;
  const inferredFileRefs = useMemo<Record<string, string>>(() => extractFileRefsFromData(data || {}), [data]);

  // PDF checks/downloads require a form URN; submission URN fails gateway validation.
  useEffect(() => {
    if (definition.generatesPdf) {
      if (pdfFileExists === null && fileQueryUrn) {
        dispatch(checkPdfFile(fileQueryUrn));
      }
    }
  }, [definition.generatesPdf, dispatch, fileQueryUrn, pdfFileExists]);

  const metadata = useSelector(metaDataSelector);
  const hasAttachedFiles = !!attachedFiles && Object.keys(attachedFiles).length > 0;
  const metadataLoaded = !!metadata && Object.keys(metadata).length > 0;
  const isMetadataReady = !hasAttachedFiles || metadataLoaded || fileBusy.loaded;

  useEffect(() => {
    Object.entries(inferredFileRefs as Record<string, string>).forEach(([propertyId, urn]) => {
      const propertyIdRoot = normalizeFilePropertyId(propertyId);
      const existingMetadata = metadata[propertyIdRoot];
      if (!existingMetadata?.find((m) => m.urn === urn)) {
        dispatch(loadFileMetadata({ propertyId: propertyIdRoot, urn }));
      }
    });
  }, [dispatch, inferredFileRefs, metadata]);

  useEffect(() => {
    if (!socketChannel && definition.generatesPdf) {
      dispatch(connectPdfStream(form.jobId));
    }

    // Cleanup socket on unmount
    return () => {
      if (definition.generatesPdf) {
        dispatch(disconnectPdfStream());
      }
    };
  }, [socketChannel, dispatch, definition, form.jobId]);

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <GoabCallout type="success" heading="We're processing your application">
          Your application was received on {form.submitted.toFormat('LLLL d, yyyy')} and we're working on it.
          {definition.generatesPdf && pdfFileExists && (
            <div>
              <DownloadLink link={() => downloadPDFFile(fileQueryUrn)} text="Download PDF copy" />
            </div>
          )}
        </GoabCallout>
        <Heading>The submitted form for your reference</Heading>
        {isMetadataReady && (
          <ContextProvider
            fileManagement={{
              fileList: metadata,
              downloadFile: downloadFormFile,
            }}
            isFormSubmitted={true}
          >
            <JsonForms
              readonly={true}
              schema={definition.dataSchema}
              uischema={readOnlyUiSchema(definition.uiSchema)}
              data={data}
              validationMode="NoValidation"
              renderers={GoAReviewRenderers}
            />
          </ContextProvider>
        )}
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
