import { GoAButton, GoAButtonGroup, GoASkeleton, GoATable } from '@abgov/react-components-new';
import { Band, Container, RowLoadMore, RowSkeleton } from '@core-services/app-common';
import { useDispatch, useSelector } from 'react-redux';
import { FunctionComponent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppDispatch,
  busySelector,
  canCreateDraftSelector,
  createForm,
  defaultUserFormSelector,
  findUserForms,
  FormDefinition,
  formsSelector,
  FormStatus,
} from '../state';

interface FormsProps {
  definition: FormDefinition;
}

export const Forms: FunctionComponent<FormsProps> = ({ definition }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const busy = useSelector(busySelector);
  const { forms, next } = useSelector(formsSelector);
  const { form: defaultForm } = useSelector(defaultUserFormSelector);
  const canCreateDraft = useSelector(canCreateDraftSelector);

  return (
    <div>
      <Band title={`Your ${definition.name} forms`}>
        Continue working on existing draft forms, or view forms you submitted in the past.
      </Band>
      <Container vs={3} hs={1}>
        <GoAButtonGroup alignment="end">
          {canCreateDraft && (
            <GoAButton
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
              <th>Created on</th>
              <th>Submitted on</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td>{form.created.toFormat('LLLL dd, yyyy')}</td>
                <td>{form.submitted?.toFormat('LLLL dd, yyyy')}</td>
                <td>{form.status}</td>
                <td>
                  <GoAButtonGroup alignment="end">
                    {form.status === FormStatus.draft ? (
                      <GoAButton
                        type={form?.id === defaultForm?.id ? 'primary' : 'secondary'}
                        onClick={() => navigate(`../${form.id}`)}
                      >
                        Continue draft
                      </GoAButton>
                    ) : (
                      <GoAButton type="secondary" onClick={() => navigate(`../${form.id}`)}>
                        View submitted
                      </GoAButton>
                    )}
                  </GoAButtonGroup>
                </td>
              </tr>
            ))}
            <RowSkeleton columns={4} show={busy.loading} />
            <RowLoadMore
              columns={4}
              next={next}
              loading={busy.loading}
              onLoadMore={(after) => dispatch(findUserForms({ definitionId: definition.id, after }))}
            />
          </tbody>
        </GoATable>
      </Container>
    </div>
  );
};
