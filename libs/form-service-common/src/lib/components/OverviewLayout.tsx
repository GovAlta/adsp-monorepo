import React, { ReactNode } from 'react';
interface OverviewProps {
  description?: string | ReactNode;
  addButton?: ReactNode;
  extra?: ReactNode;
  testId?: string;
}

export const OverviewLayout = (props: OverviewProps): JSX.Element => {
  return (
    <div data-testid={props?.testId}>
      {typeof props?.description === 'string' && (
        <section>
          <p>{`${props?.description}`}</p>
        </section>
      )}
      {typeof props?.description === 'object' && props?.description}
      {props?.addButton}
      {props?.extra}
    </div>
  );
};
