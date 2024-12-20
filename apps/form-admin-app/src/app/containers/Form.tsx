import { GoAFormItem } from '@abgov/react-components-new';
import { DateTime } from 'luxon';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, definitionSelector, formSelector, selectForm } from '../state';
import { FormViewer } from '../components/FormViewer';
import { DetailsLayout } from '../components/DetailsLayout';
import { ContentContainer } from '../components/ContentContainer';
import { PropertiesContainer } from '../components/PropertiesContainer';

export const Form = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { formId } = useParams();
  const definition = useSelector(definitionSelector);
  const form = useSelector(formSelector);

  useEffect(() => {
    dispatch(selectForm(formId));
  }, [dispatch, formId]);

  return (
    <DetailsLayout
      initialized={!!(definition && form)}
      header={
        form && (
          <PropertiesContainer>
            <GoAFormItem mr="xl" mb="s" label="Status">
              {form.status}
            </GoAFormItem>
            <GoAFormItem mr="xl" mb="s" label="Applicant">
              {form.applicant?.addressAs}
            </GoAFormItem>
            <GoAFormItem mr="s" mb="s" label="Created by">
              {form.createdBy.name}
            </GoAFormItem>
            <GoAFormItem mr="xl" mb="s" label="Created on">
              {DateTime.fromISO(form.created).toFormat('LLL dd, yyyy')}
            </GoAFormItem>
            <GoAFormItem mr="xl" mb="s" label="Submitted on">
              {form.submitted && DateTime.fromISO(form.submitted).toFormat('LLL dd, yyyy')}
            </GoAFormItem>
          </PropertiesContainer>
        )
      }
      actionsForm={<form></form>}
    >
      <ContentContainer>
        <FormViewer dataSchema={definition?.dataSchema} uiSchema={definition?.uiSchema} data={form?.data} />
      </ContentContainer>
    </DetailsLayout>
  );
};
