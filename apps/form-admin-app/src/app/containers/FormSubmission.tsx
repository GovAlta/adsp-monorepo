import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, definitionSelector, selectSubmission, submissionSelector } from '../state';
import { FormViewer } from '../components/FormViewer';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { submissionId } = useParams();
  const definition = useSelector(definitionSelector);
  const submission = useSelector(submissionSelector);

  useEffect(() => {
    dispatch(selectSubmission(submissionId));
  }, [dispatch, submissionId]);

  return (
    <DetailsLayout>
      <ContentContainer>
        <FormViewer dataSchema={definition?.dataSchema} uiSchema={definition?.uiSchema} data={submission?.formData} />
      </ContentContainer>
    </DetailsLayout>
  );
};
