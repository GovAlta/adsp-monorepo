import React, { FunctionComponent, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { GoabButton, GoabCallout } from '@abgov/react-components';
import { RootState } from '@store/index';
import { fetchAuditEvent } from '@store/audit/actions';
import { Page, Main, Aside, AsidePadding } from '@components/Html';
import AsideLinks from '@components/AsideLinks';
import { PageIndicator } from '@components/Indicator';
import { AuditEventDetails } from './eventDetails';

const READER_ROLE = 'audit-reader';

export const AuditEventPage: FunctionComponent = () => {
  const { namespace, id } = useParams<{ namespace: string; id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:audit-service']?.roles?.includes(READER_ROLE),
  );
  const { event, loading, notFound } = useSelector((state: RootState) => state.audit.selected);

  useEffect(() => {
    if (hasReaderRole && namespace && id) {
      dispatch(fetchAuditEvent(namespace, id));
    }
  }, [dispatch, hasReaderRole, namespace, id]);

  useEffect(() => {
    if (event) {
      headingRef.current?.focus();
    }
  }, [event]);

  const showEvent = event && event.id === id;

  return (
    <Page>
      <Main>
        <GoabButton
          type="tertiary"
          size="compact"
          leadingIcon="arrow-back"
          onClick={() => navigate('/admin/services/audit/logs')}
          testId="audit-event-back"
        >
          Back to audit log
        </GoabButton>
        <h1 ref={headingRef} tabIndex={-1} data-testid="audit-event-title">
          Audit event
        </h1>
        {!hasReaderRole && (
          <GoabCallout heading="Audit reader role required" type="information" testId="audit-role-callout">
            <p>You need the urn:ads:platform:audit-service 'audit-reader' role to see audit events.</p>
          </GoabCallout>
        )}
        {hasReaderRole && loading && <PageIndicator />}
        {hasReaderRole && !loading && notFound && (
          <GoabCallout heading="Audit event not found" type="important" testId="audit-event-not-found">
            <p>The audit event does not exist, or has been removed under its retention policy.</p>
          </GoabCallout>
        )}
        {hasReaderRole && !loading && showEvent && <AuditEventDetails event={event} />}
      </Main>
      <Aside>
        <AsidePadding>
          <AsideLinks serviceName="audit" />
        </AsidePadding>
      </Aside>
    </Page>
  );
};
