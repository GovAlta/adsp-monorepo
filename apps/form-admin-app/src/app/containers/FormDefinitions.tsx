import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, busySelector, definitionsSelector, loadDefinitions, nextSelector, userSelector } from '../state';
import { GoABadge, GoAButton, GoAButtonGroup, GoACallout, GoATable } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';
import { SearchLayout } from '../components/SearchLayout';
import { ContentContainer } from '../components/ContentContainer';

const FeatureBadge: FunctionComponent<{ feature?: boolean }> = ({ feature }) => {
  return feature ? <GoABadge type="success" content="Yes" /> : <GoABadge type="information" content="No" />;
};

export const FormsDefinitions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { user } = useSelector(userSelector);
  const busy = useSelector(busySelector);
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
            <GoAButtonGroup alignment="end">
              <GoAButton type="primary" disabled={busy.loading} onClick={() => dispatch(loadDefinitions({}))}>
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
              <th>Anonymous applicant</th>
              <th>Creates submissions</th>
              <th>Creates PDF</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((definition) => (
              <tr key={definition.id}>
                <td>{definition.name}</td>
                <td>
                  <FeatureBadge feature={definition.anonymousApply} />
                </td>
                <td>
                  <FeatureBadge feature={definition.submissionRecords} />
                </td>
                <td>
                  <FeatureBadge feature={definition.generatesPdf} />
                </td>
                <td>
                  <GoAButtonGroup alignment="end">
                    <GoAButton type="secondary" size="compact" onClick={() => navigate(definition.id)}>
                      Select
                    </GoAButton>
                  </GoAButtonGroup>
                </td>
              </tr>
            ))}
            {next && (
              <td colSpan={5}>
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
            )}
          </tbody>
        </GoATable>
      </ContentContainer>
    </SearchLayout>
  );
};
