import { GoAContainer, GoADetails, GoAFormItem } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { definitionSelector } from '../state';
import { ContentContainer } from '../components/ContentContainer';

interface FormDefinitionOverviewProps {
  definitionId: string;
}

export const FormDefinitionOverview: FunctionComponent<FormDefinitionOverviewProps> = () => {
  const definition = useSelector(definitionSelector);

  return (
    <ContentContainer>
      <GoAContainer>
        <GoAFormItem label="ID">
          <span>{definition.id}</span>
        </GoAFormItem>
        <GoAFormItem label="Name">
          <span>{definition.name}</span>
        </GoAFormItem>
        <GoAFormItem label="Description">
          <span>{definition.description}</span>
        </GoAFormItem>
      </GoAContainer>
      {definition.anonymousApply ? (
        <GoADetails heading="Anonymous applicants">Applicants can create and submit forms without signing in.</GoADetails>
      ) : (
        <GoADetails heading="Signed in applicants">Applicants must sign in in order to create and submit forms.</GoADetails>
      )}
      {definition.submissionRecords ? (
        <GoADetails heading="Creates submission records">Submission records are created when forms are submitted.</GoADetails>
      ) : (
        <GoADetails heading="No submission records">Submission records are not created when forms are submitted.</GoADetails>
      )}
    </ContentContainer>
  );
};
