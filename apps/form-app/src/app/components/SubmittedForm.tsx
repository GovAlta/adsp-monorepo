import { GoAReviewRenderers, ContextProviderFactory } from '@abgov/jsonforms-components';
import { UISchemaElement } from '@jsonforms/core';
import { AppState } from '../state';
import { GoabCallout } from '@abgov/react-components';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useEffect } from 'react';
import styled from 'styled-components';
import { Form, FormDefinition, metaDataSelector, AppDispatch, downloadFile, downloadFormPdf, store } from '../state';
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

export const SubmittedForm: FunctionComponent<ApplicationStatusProps> = ({ definition, form, data }) => {
  const dispatch = useDispatch<AppDispatch>();
  const pdfFileExists = useSelector((state: AppState) => checkPdfFileSelector(state) || checkExistingPdfFile(state));

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

  // Mount-only effect: Check if PDF already exists (e.g., from a previous session or page reload).
  // Empty deps are intentional - we only want this initial check once, not on every state change.
  // Subsequent PDF status updates come through the socket stream, not this effect.
  useEffect(() => {
    if (definition.generatesPdf) {
      if (pdfFileExists === null && form?.urn) {
        dispatch(checkPdfFile(form.submission?.id ? form.submission.urn : form?.urn));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const metadata = useSelector(metaDataSelector);

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
              <DownloadLink
                link={() => downloadPDFFile(form.submission?.id ? form.submission.urn : form?.urn)}
                text="Download PDF copy"
              />
            </div>
          )}
        </GoabCallout>
        <Heading>The submitted form for your reference</Heading>
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
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
