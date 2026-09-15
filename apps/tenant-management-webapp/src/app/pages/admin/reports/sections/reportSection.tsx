import { GoabCallout, GoabContainer, GoabSkeleton } from '@abgov/react-components';
import { SectionState } from '@store/serviceReports/models';
import React, { FunctionComponent, ReactNode } from 'react';
import { SectionHeading } from '../styled-components';

export interface ReportSectionFrameProps {
  title: string;
  testId: string;
  state: SectionState;
  /** Rendered when no loader is registered yet. */
  placeholder: ReactNode;
  /** Rendered when status is 'loaded' and data is non-empty. */
  children?: ReactNode;
}

const isEmptyData = (data: unknown): boolean => {
  if (data == null) {
    return true;
  }
  return Array.isArray(data) && data.length === 0;
};

export const ReportSection: FunctionComponent<ReportSectionFrameProps> = ({
  title,
  testId,
  state,
  placeholder,
  children,
}) => {
  let body: ReactNode;

  if (state.status === 'error') {
    body = (
      <GoabCallout type="emergency" heading="Unable to load this section" testId={`${testId}-error`}>
        {state.error}
      </GoabCallout>
    );
  } else if (state.status === 'loading' && state.data == null) {
    body = <GoabSkeleton type="card" testId={`${testId}-skeleton`} />;
  } else if (state.status === 'idle') {
    body = placeholder;
  } else if (state.status === 'loaded' && isEmptyData(state.data)) {
    body = <p>No data for the selected period</p>;
  } else {
    body = children;
  }

  return (
    <section>
      <SectionHeading>{title}</SectionHeading>
      <GoabContainer testId={testId}>{body}</GoabContainer>
    </section>
  );
};
