import { GoabBadge, GoabButton, GoabButtonGroup, GoabCallout, GoabTable } from '@abgov/react-components';
import { RowLoadMore, RowSkeleton } from '@core-services/app-common';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  formBusySelector,
  definitionsSelector,
  directoryBusySelector,
  FormDefinition,
  loadDefinitions,
  nextSelector,
  tagResource,
  userSelector,
  Resource,
  definitionCriteriaSelector,
  formActions,
} from '../state';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { AddTagModal } from '../components/AddTagModal';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';
import { Tags } from './Tags';
import { TagSearchFilter } from './TagSearchFilter';

const FeatureBadge: FunctionComponent<{ feature: string; hasFeature?: boolean }> = ({ feature, hasFeature }) => {
  return hasFeature && <GoabBadge type="information" content={feature} mr="xs" mb="xs" icon={false} />;
};

interface FormDefinitionRowProps {
  definition: FormDefinition;
  navigate: NavigateFunction;
  onTag: () => void;
}

export const FormDefinitionRow: FunctionComponent<FormDefinitionRowProps> = ({ definition, navigate, onTag }) => {
  return (
    <tr key={definition.id}>
      <td>{definition.name}</td>
      <td>
        <Tags urn={definition.urn} onTag={onTag} />
      </td>
      <td>
        <FeatureBadge feature="Anonymous applicant" hasFeature={definition.anonymousApply} />
        <FeatureBadge
          feature="Multiple forms"
          hasFeature={!definition.anonymousApply && !definition.oneFormPerApplicant}
        />
        <FeatureBadge feature="Applicant questions" hasFeature={definition.supportTopic} />
        <FeatureBadge feature="Creates submissions" hasFeature={definition.submissionRecords} />
        <FeatureBadge feature="Creates PDF" hasFeature={definition.generatesPdf} />
        <FeatureBadge feature="Scheduled intakes" hasFeature={definition.scheduledIntakes} />
      </td>
      <td>
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" size="compact" onClick={() => navigate(definition.id)}>
            Select
          </GoabButton>
        </GoabButtonGroup>
      </td>
    </tr>
  );
};

export const FormsDefinitions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showTagDefinition, setShowTagDefinition] = useState<Pick<Resource, 'name' | 'urn'>>(null);

  const { user } = useSelector(userSelector);
  const directoryBusy = useSelector(directoryBusySelector);

  const busy = useSelector(formBusySelector);
  const criteria = useSelector(definitionCriteriaSelector);
  const { definitions: next } = useSelector(nextSelector);
  const definitions = useSelector(definitionsSelector);

  useEffect(() => {
    if (user?.roles.includes('urn:ads:platform:form-service:form-admin') && definitions.length < 1) {
      dispatch(loadDefinitions({ tag: criteria.tag }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user]);

  return (
    <SearchLayout
      searchForm={
        user?.roles.includes('urn:ads:platform:form-service:form-admin') ? (
          <form>
            <TagSearchFilter
              value={criteria.tag}
              onChange={(value) => dispatch(formActions.setDefinitionCriteria({ tag: value }))}
            />
            <GoabButtonGroup alignment="end" mt="l">
              <GoabButton
                type="secondary"
                disabled={busy.loading}
                onClick={() => dispatch(formActions.setDefinitionCriteria({}))}
              >
                Reset filter
              </GoabButton>
              <GoabButton
                type="primary"
                disabled={busy.loading}
                onClick={() => dispatch(loadDefinitions({ tag: criteria.tag }))}
              >
                Load definitions
              </GoabButton>
            </GoabButtonGroup>
          </form>
        ) : (
          <div>
            <GoabCallout heading="Access to listing not available" type="information">
              You don't have permission to access the listing of Form definitions. Contact your administrator for
              access, or for links to the specific workspaces you need access to.
            </GoabCallout>
          </div>
        )
      }
    >
      <ContentContainer>
        <GoabTable width="100%">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tags</th>
              <th>Features</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((definition) => (
              <FormDefinitionRow
                key={definition.id}
                navigate={navigate}
                definition={definition}
                onTag={() => setShowTagDefinition(definition)}
              />
            ))}
            <RowSkeleton columns={4} show={busy.loading} />
            <RowLoadMore
              columns={4}
              next={next}
              loading={busy.loading}
              onLoadMore={(after) => dispatch(loadDefinitions({ after }))}
            />
          </tbody>
        </GoabTable>
      </ContentContainer>
      <AddTagModal
        open={!!showTagDefinition}
        resource={showTagDefinition}
        tagging={directoryBusy.executing}
        onClose={() => setShowTagDefinition(null)}
        onTag={async (urn, label) => {
          await dispatch(tagResource({ urn, label }));
          setShowTagDefinition(null);
        }}
      />
    </SearchLayout>
  );
};
