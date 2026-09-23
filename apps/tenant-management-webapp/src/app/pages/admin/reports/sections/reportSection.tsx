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
  /** Rendered while the section is fetching. Defaults to a card skeleton. */
  loading?: ReactNode;
  /** Rendered when status is 'loaded' and data is non-empty, and under an error callout. */
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
  loading,
  children,
}) => {
  const skeleton = loading ?? <GoabSkeleton type="card" testId={`${testId}-skeleton`} />;
  const errorCallout = (
    <GoabCallout type="emergency" heading="Something went wrong" testId={`${testId}-error`}>
      {state.error || 'This section could not be loaded. Try again.'}
    </GoabCallout>
  );

  let body: ReactNode;

  if (state.status === 'loading') {
    body = skeleton;
  } else if (state.status === 'error') {
    body = (
      <>
        {errorCallout}
        {children}
      </>
    );
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
