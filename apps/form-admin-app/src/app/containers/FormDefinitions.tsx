import { GoABadge, GoAButton, GoAButtonGroup, GoACallout, GoATable } from '@abgov/react-components-new';
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
} from '../state';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { AddTagModal } from '../components/AddTagModal';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';
import { Tags } from './Tags';
import { TagSearchFilter } from './TagSearchFilter';

const FeatureBadge: FunctionComponent<{ feature: string; hasFeature?: boolean }> = ({ feature, hasFeature }) => {
  return hasFeature && <GoABadge type="information" content={feature} mr="xs" mb="xs" />;
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
        <FeatureBadge feature="Applicant questions" hasFeature={definition.supportTopic} />
        <FeatureBadge feature="Creates submissions" hasFeature={definition.submissionRecords} />
        <FeatureBadge feature="Creates PDF" hasFeature={definition.generatesPdf} />
        <FeatureBadge feature="Scheduled intakes" hasFeature={definition.scheduledIntakes} />
      </td>
      <td>
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" size="compact" onClick={() => navigate(definition.id)}>
            Select
          </GoAButton>
        </GoAButtonGroup>
      </td>
    </tr>
  );
};

export const FormsDefinitions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showTagDefinition, setShowTagDefinition] = useState<Pick<Resource, 'name' | 'urn'>>(null);
  const [searchTag, setSearchTag] = useState('');

  const { user } = useSelector(userSelector);

  const directoryBusy = useSelector(directoryBusySelector);

  const busy = useSelector(formBusySelector);
  const { definitions: next } = useSelector(nextSelector);
  const definitions = useSelector(definitionsSelector);

  useEffect(() => {
    if (user?.roles.includes('urn:ads:platform:form-service:form-admin')) {
      dispatch(loadDefinitions({}));
    }
  }, [dispatch, user]);

  return (
    <SearchLayout
      searchForm={
        user?.roles.includes('urn:ads:platform:form-service:form-admin') ? (
          <form>
            <TagSearchFilter value={searchTag} onChange={(value) => setSearchTag(value)} />
            <GoAButtonGroup alignment="end" mt="l">
              <GoAButton type="secondary" disabled={busy.loading} onClick={() => setSearchTag('')}>
                Reset filter
              </GoAButton>
              <GoAButton
                type="primary"
                disabled={busy.loading}
                onClick={() => dispatch(loadDefinitions({ tag: searchTag }))}
              >
                Load definitions
              </GoAButton>
            </GoAButtonGroup>
          </form>
        ) : (
          <div>
            <GoACallout heading="Access to listing not available" type="information">
              You don't have permission to access the listing of Form definitions. Contact your administrator for
              access, or for links to the specific workspaces you need access to.
            </GoACallout>
          </div>
        )
      }
    >
      <ContentContainer>
        <GoATable width="100%">
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
        </GoATable>
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
