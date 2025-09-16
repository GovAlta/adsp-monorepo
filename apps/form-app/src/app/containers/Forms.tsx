import { GoAButton, GoAButtonGroup, GoATable } from '@abgov/react-components';
import { Band, Container, RowLoadMore, RowSkeleton } from '@core-services/app-common';
import { useDispatch, useSelector } from 'react-redux';
import { FunctionComponent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  busySelector,
  canCreateDraftSelector,
  createForm,
  defaultUserFormSelector,
  definitionFormsSelector,
  findUserForms,
  FormDefinition,
  FormStatus,
  tenantSelector,
} from '../state';

const FormsLayout = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
`;

interface FormsProps {
  definition?: FormDefinition;
}

export const Forms: FunctionComponent<FormsProps> = ({ definition }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const tenant = useSelector(tenantSelector);
  const busy = useSelector(busySelector);
  const { forms, next } = useSelector((state) => definitionFormsSelector(state, definition?.id));
  const { form: defaultForm } = useSelector(defaultUserFormSelector);
  const canCreateDraft = useSelector(canCreateDraftSelector);

  useEffect(() => {
    dispatch(findUserForms({ definitionId: definition?.id }));
  }, [dispatch, definition]);

  return (
    <FormsLayout>
      <Band title={`Your ${definition?.name ? `${definition?.name} ` : ' '}forms`}>
        Continue working on draft forms or view forms you submitted in the past.
      </Band>
      <Container vs={3} hs={1}>
        <GoAButtonGroup alignment="end">
          {definition && canCreateDraft && (
            <GoAButton
              mr="m"
              disabled={busy.creating}
              type={defaultForm?.status === FormStatus.draft ? 'secondary' : 'primary'}
              onClick={async () => {
                const form = await dispatch(createForm(definition.id)).unwrap();
                if (form?.id) {
                  navigate(`../${form.id}`);
                }
              }}
            >
              Start new draft
            </GoAButton>
          )}
        </GoAButtonGroup>
        <GoATable width="100%">
          <thead>
            <tr>
              {!definition && <th>Form</th>}
              <th>Created on</th>
              <th>Submitted on</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                {!definition && <td>{form.definition?.name}</td>}
                <td>{form.created.toFormat('LLLL dd, yyyy')}</td>
                <td>{form.submitted?.toFormat('LLLL dd, yyyy')}</td>
                <td>{form.status}</td>
                <td>
                  <GoAButtonGroup alignment="end">
                    {form.definition &&
                      (form.status === FormStatus.draft ? (
                        <GoAButton
                          type={form?.id === defaultForm?.id ? 'primary' : 'secondary'}
                          size="compact"
                          onClick={() => navigate(`/${tenant.name}/${form.definition.id}/${form.id}`)}
                        >
                          Continue draft
                        </GoAButton>
                      ) : (
                        <GoAButton
                          type="secondary"
                          size="compact"
                          onClick={() => navigate(`/${tenant.name}/${form.definition.id}/${form.id}`)}
                        >
                          View submitted
                        </GoAButton>
                      ))}
                  </GoAButtonGroup>
                </td>
              </tr>
            ))}
            <RowSkeleton columns={4 + (!definition ? 1 : 0)} show={busy.loading} />
            <RowLoadMore
              columns={4 + (!definition ? 1 : 0)}
              next={next}
              loading={busy.loading}
              onLoadMore={(after) => dispatch(findUserForms({ definitionId: definition?.id, after }))}
            />
          </tbody>
        </GoATable>
      </Container>
    </FormsLayout>
  );
};
