import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, definitionSelector, formSelector, selectForm } from '../state';
import { FormViewer } from '../components/FormViewer';
import { DetailsLayout } from '../components/DetailsLayout';

export const Form = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { formId } = useParams();
  const definition = useSelector(definitionSelector);
  const form = useSelector(formSelector);

  useEffect(() => {
    dispatch(selectForm(formId));
  }, [dispatch, formId]);

  return (
    <DetailsLayout initialized={!!(definition && form)} actionsForm={<form></form>}>
      <FormViewer dataSchema={definition?.dataSchema} uiSchema={definition?.uiSchema} data={form?.data} />
    </DetailsLayout>
  );
};
