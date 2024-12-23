import { GoACheckbox, GoAContainer, GoADetails, GoAFormItem, GoASpacer, GoATable } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AppDispatch, dataValuesSelector, definitionSelector, updateDataValue } from '../state';
import { ContentContainer } from '../components/ContentContainer';

const OverviewLayout = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
`;

interface FormDefinitionOverviewProps {
  definitionId: string;
}

export const FormDefinitionOverview: FunctionComponent<FormDefinitionOverviewProps> = () => {
  const dispatch = useDispatch<AppDispatch>();

  const definition = useSelector(definitionSelector);
  const dataValues = useSelector(dataValuesSelector);

  return (
    <OverviewLayout>
      <ContentContainer>
        <h2>Overview</h2>
        <GoAContainer mt="m">
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
        <h3>General</h3>
        <GoASpacer vSpacing="m" />
        {definition.anonymousApply ? (
          <GoADetails heading="Anonymous applicants">
            Applicants can create and submit forms without signing in. This can reduce the quality of submissions, and
            users may resubmit the same information more than once.
          </GoADetails>
        ) : (
          <GoADetails heading="Signed in applicants">
            Applicants must sign in to create and submit forms. The user applying can start and resume from a draft of
            the form, then submit once ready.
          </GoADetails>
        )}
        {definition.generatesPdf ? (
          <GoADetails heading="Creates PDF when submitted">
            PDF copy of the submitted information is created when forms are submitted.
          </GoADetails>
        ) : (
          <GoADetails heading="No PDF is created">PDF copy is not created when forms are submitted.</GoADetails>
        )}
        {definition.submissionRecords ? (
          <GoADetails heading="Creates submission records">
            Submission records are created when forms are submitted. The submission captures the information in the form
            when it is submitted for processing, and it can be dispositioned to record a decision.
          </GoADetails>
        ) : (
          <GoADetails heading="No submission records">
            Submission records are not created when forms are submitted. The form status indicates if it has been
            submitted. Any follow-up actions such as service fulfillment or client onboarding need to be handled outside
            the form system.
          </GoADetails>
        )}
        <h3>Data value columns</h3>
        <p>
          Select the form data values to show as columns so that forms and submissions are easier to view at a glance.
          The preferences shown here are saved and shared between users accessing this application from this
          workstation.
        </p>
        <GoATable width="100%" mt="m">
          <thead>
            <tr>
              <th>Name</th>
              <th>Path</th>
              <th>Show column</th>
            </tr>
          </thead>
          <tbody>
            {dataValues.map(({ name, path, selected }) => (
              <tr key={path}>
                <td>{name}</td>
                <td>{path}</td>
                <td>
                  <GoACheckbox
                    name="Show column"
                    mt="s"
                    checked={!!selected}
                    onChange={(_, selected) =>
                      dispatch(updateDataValue({ definitionId: definition.id, path, selected }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </GoATable>
      </ContentContainer>
    </OverviewLayout>
  );
};
