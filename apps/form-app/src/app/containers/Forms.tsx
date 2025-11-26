import {
  GoABadge,
  GoABlock,
  GoAButton,
  GoAButtonGroup,
  GoAContainer,
  GoADivider,
  GoASkeleton,
} from '@abgov/react-components';
import { Container } from '@core-services/app-common';
import { useDispatch, useSelector } from 'react-redux';
import { FunctionComponent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  busySelector,
  canCreateDraftSelector,
  createForm,
  defaultUserFormSelector,
  definitionFormsSelector,
  deleteForm,
  findUserForms,
  Form,
  FormDefinition,
  FormStatus,
  tenantSelector,
  userSelector,
} from '../state';
import { SignInStartApplication } from '../components/SignInStartApplication';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { DeleteFormModal } from '../components/DeleteFormModal';

const PageTitleDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-top: var(--goa-space-xl);
  margin-bottom: var(--goa-space-l);
  & h2 {
    margin-top: 0;
  }
`;

const FormHeaderDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
`;

const FormDescriptionParagraph = styled.p`
  color: var(--goa-color-text-secondary);
  margin-top: var(--goa-space-xs);
  margin-bottom: 0;
`;

const FormMetadataLabel = styled.label`
  font-weight: bold;
`;

const FormLoadMoreDiv = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--goa-space-l);
`;

const FormsLayout = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
  & > *:first-child {
    max-width: 1024px;
    padding-bottom: var(--goa-space-xl);
  }
`;

const FormStatusBadge: FunctionComponent<{ status: FormStatus }> = ({ status }) => {
  switch (status) {
    case FormStatus.draft:
      return <GoABadge mt="xs" type="information" content={status} icon={false} />;
    case FormStatus.submitted:
      return <GoABadge mt="xs" type="success" content={status} icon={false} />;
    default:
      return <GoABadge mt="xs" type="light" content={status} icon={false} />;
  }
};

interface FormsProps {
  definition?: FormDefinition;
}

export const Forms: FunctionComponent<FormsProps> = ({ definition }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const tenant = useSelector(tenantSelector);
  const { initialized, user } = useSelector(userSelector);
  const busy = useSelector(busySelector);
  const { forms, next } = useSelector((state) => definitionFormsSelector(state, definition?.id));
  const { form: defaultForm } = useSelector(defaultUserFormSelector);
  const canCreateDraft = useSelector(canCreateDraftSelector);
  const [formToDelete, setFormToDelete] = useState(null);

  useEffect(() => {
    dispatch(findUserForms({ definitionId: definition?.id }));
  }, [dispatch, definition]);

  return initialized ? (
    user ? (
      <FormsLayout>
        <Container vs={0} hs={1}>
          <PageTitleDiv>
            <div>
              <h2>My applications</h2>
              <p>
                Below is a list of your draft and submitted applications. You can continue working on a draft
                application or view a submitted one.
              </p>
            </div>
            <GoAButtonGroup alignment="end">
              {definition && canCreateDraft && (
                <GoAButton
                  mr="m"
                  disabled={busy.creating}
                  type="tertiary"
                  leadingIcon="add"
                  onClick={async () => {
                    const form = await dispatch(createForm(definition.id)).unwrap();
                    if (form?.id) {
                      navigate(`../${form.id}`);
                    }
                  }}
                >
                  New application
                </GoAButton>
              )}
            </GoAButtonGroup>
          </PageTitleDiv>
          {forms
            .filter((form) => !!form.definition)
            .map((form) => (
              <GoAContainer key={form.id} mb="m">
                <FormHeaderDiv>
                  <div>
                    {form.definition.name}
                    <FormDescriptionParagraph>{form.definition.description}</FormDescriptionParagraph>
                  </div>
                  <GoAButtonGroup alignment="end">
                    {form.definition &&
                      (form.status === FormStatus.draft ? (
                        <>
                          <GoAButton
                            type="tertiary"
                            size="compact"
                            leadingIcon="trash"
                            onClick={() => setFormToDelete(form)}
                          >
                            Delete
                          </GoAButton>
                          <GoAButton
                            type={form?.id === defaultForm?.id ? 'primary' : 'secondary'}
                            size="compact"
                            onClick={() => navigate(`/${tenant.name}/${form.definition.id}/${form.id}`)}
                          >
                            Continue
                          </GoAButton>
                        </>
                      ) : (
                        <GoAButton
                          type="tertiary"
                          size="compact"
                          onClick={() => navigate(`/${tenant.name}/${form.definition.id}/${form.id}`)}
                        >
                          View
                        </GoAButton>
                      ))}
                  </GoAButtonGroup>
                </FormHeaderDiv>
                <GoADivider mt="m" />
                <GoABlock gap="4xl" direction="row" mt="m">
                  <div>
                    <FormMetadataLabel>Status</FormMetadataLabel>
                    <div>
                      <FormStatusBadge status={form.status} />
                    </div>
                  </div>
                  <div>
                    <FormMetadataLabel>Created</FormMetadataLabel>
                    <div>{form.created.toFormat('LLLL dd, yyyy')}</div>
                  </div>
                  <div>
                    <FormMetadataLabel>Submitted</FormMetadataLabel>
                    <div>{form.submitted?.toFormat('LLLL dd, yyyy') || 'Not submitted'}</div>
                  </div>
                </GoABlock>
              </GoAContainer>
            ))}
          {busy.loading && <GoASkeleton type="card" size={1} lineCount={2} />}
          <FormLoadMoreDiv>
            {next && (
              <GoAButton
                type="tertiary"
                disabled={busy.loading}
                onClick={() => dispatch(findUserForms({ definitionId: definition?.id, after: next }))}
              >
                Load more
              </GoAButton>
            )}
          </FormLoadMoreDiv>
        </Container>
        <DeleteFormModal
          form={formToDelete}
          open={!!formToDelete}
          deleting={busy.deleting}
          onClose={() => setFormToDelete(null)}
          onDelete={async (form) => {
            await dispatch(deleteForm(form.id));
            setFormToDelete(null);
          }}
        />
      </FormsLayout>
    ) : (
      <SignInStartApplication />
    )
  ) : (
    <LoadingIndicator isLoading={!initialized || busy.loading} />
  );
};
