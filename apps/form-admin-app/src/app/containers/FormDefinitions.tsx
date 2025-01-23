import {
  GoABadge,
  GoAButton,
  GoAButtonGroup,
  GoACallout,
  GoAChip,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAIconButton,
  GoASkeleton,
  GoATable,
} from '@abgov/react-components-new';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  AppState,
  formBusySelector,
  definitionsSelector,
  directoryBusySelector,
  FormDefinition,
  getResourceTags,
  loadDefinitions,
  nextSelector,
  resourceTagsSelector,
  Tag,
  tagResource,
  untagResource,
  userSelector,
  getTags,
  tagsSelector,
  Resource,
} from '../state';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { AddTagModal } from '../components/AddTagModal';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';
import { RowSkeleton } from '../components/RowSkeleton';

const FeatureBadge: FunctionComponent<{ feature: string; hasFeature?: boolean }> = ({ feature, hasFeature }) => {
  return hasFeature && <GoABadge type="information" content={feature} mr="xs" mb="xs" />;
};

const TagBadge: FunctionComponent<{ tag: Tag; onDelete: () => void }> = ({ tag, onDelete }) => {
  return <GoAChip content={tag.label} deletable={true} onClick={onDelete} mr="xs" mb="xs" />;
};

interface FormDefinitionRowProps {
  definition: FormDefinition;
  loadingTags: boolean;
  dispatch: AppDispatch;
  navigate: NavigateFunction;
  onTag: () => void;
  onUntag: (tag: Tag) => void;
}

export const FormDefinitionRow: FunctionComponent<FormDefinitionRowProps> = ({
  definition,
  loadingTags,
  dispatch,
  navigate,
  onTag,
  onUntag,
}) => {
  const tags = useSelector((state: AppState) => resourceTagsSelector(state, definition.urn));

  useEffect(() => {
    dispatch(getResourceTags({ urn: definition.urn }));
  }, [dispatch, definition]);

  return (
    <tr key={definition.id}>
      <td>{definition.name}</td>
      {loadingTags ? (
        <td>
          <GoASkeleton type="text-small" />
        </td>
      ) : (
        <td>
          {tags?.map((tag) => (
            <TagBadge key={tag.value} tag={tag} onDelete={() => onUntag(tag)} />
          ))}
          <GoAIconButton icon="add-circle" variant="color" onClick={onTag} />
        </td>
      )}
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
  const tags = useSelector(tagsSelector);

  const busy = useSelector(formBusySelector);
  const { definitions: next } = useSelector(nextSelector);
  const definitions = useSelector(definitionsSelector);

  useEffect(() => {
    if (user?.roles.includes('urn:ads:platform:form-service:form-admin')) {
      dispatch(loadDefinitions({}));
    }
  }, [dispatch, user]);

  useEffect(() => {
    dispatch(getTags({}));
  }, [dispatch]);

  return (
    <SearchLayout
      searchForm={
        user?.roles.includes('urn:ads:platform:form-service:form-admin') ? (
          <form>
            <GoAFormItem label="Tag">
              <GoADropdown
                name="tag"
                relative={true}
                value={searchTag}
                onChange={(_: string, value: string) => setSearchTag(value)}
              >
                {tags.map(({ value, label }) => (
                  <GoADropdownItem key={value} value={value} label={label} />
                ))}
              </GoADropdown>
            </GoAFormItem>
            <GoAButtonGroup alignment="end">
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
                dispatch={dispatch}
                navigate={navigate}
                definition={definition}
                loadingTags={directoryBusy.loadingResourceTags[definition.urn]}
                onTag={() => setShowTagDefinition(definition)}
                onUntag={(tag) => dispatch(untagResource({ urn: definition.urn, tag }))}
              />
            ))}
            <RowSkeleton columns={4} show={busy.loading} />
            {next && (
              <tr>
                <td colSpan={4}>
                  <GoAButtonGroup alignment="center">
                    <GoAButton
                      type="tertiary"
                      disabled={busy.loading}
                      onClick={() => dispatch(loadDefinitions({ after: next }))}
                    >
                      Load more
                    </GoAButton>
                  </GoAButtonGroup>
                </td>
              </tr>
            )}
          </tbody>
        </GoATable>
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
      </ContentContainer>
    </SearchLayout>
  );
};
