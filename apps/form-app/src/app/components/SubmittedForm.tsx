import { GoARenderers, ContextProviderFactory } from '@abgov/jsonforms-components';
import { UISchemaElement } from '@jsonforms/core';
import { AppState } from '../state';
import { GoACallout } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import moment from 'moment';
import { FunctionComponent, useEffect } from 'react';
import styled from 'styled-components';
import { Form, FormDefinition, metaDataSelector, AppDispatch, downloadFile, downloadFormPdf, store } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import { pdfFileSelector, checkPdfFileSelector, checkPdfFile } from '../state';
import { DownloadLink } from '../containers/DownloadLink';
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
  const pdfFile = useSelector((state: AppState) => pdfFileSelector(state));
  const pdfFileExists = useSelector((state: AppState) => checkPdfFileSelector(state));

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

  useEffect(() => {
    if (definition.generatesPdf) {
      if (pdfFileExists === null && form?.urn) {
        dispatch(checkPdfFile(form.submission?.id ? form.submission.urn : form?.urn));
      }
    }

    const intervalId = setInterval(() => {
      if (definition.generatesPdf) {
        if (!pdfFileExists) {
          dispatch(checkPdfFile(form.submission?.id ? form.submission.urn : form?.urn));
        }
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(intervalId);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [dispatch, definition, form, pdfFile, pdfFileExists]);

  const metadata = useSelector(metaDataSelector);

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <GoACallout type="success" heading="We're processing your application">
          Your application was received on {moment(form.submitted).format('MMMM D, YYYY')} and we're working on it.
          {definition.generatesPdf && pdfFileExists && (
            <DownloadLink
              link={() => downloadPDFFile(form.submission?.id ? form.submission.urn : form?.urn)}
              text="Download PDF copy"
            />
          )}
        </GoACallout>
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
            renderers={GoARenderers}
          />
        </ContextProvider>
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
