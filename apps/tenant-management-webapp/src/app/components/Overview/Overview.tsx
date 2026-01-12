import React, { ReactNode } from 'react';
import { GoabButton } from '@abgov/react-components';
import { OverviewLayout } from './OverviewLayout';

export interface AddButtonConfig {
  text?: string;
  onClickCallback?: () => void;
  disabled?: boolean;
  testId?: string;
}

export interface DescriptionConfig {
  content: string | string[];
  class?: string;
}

export interface OverviewConfiguration {
  addButton: AddButtonConfig;
  description: DescriptionConfig;
}

interface OverviewProps {
  /** service name. It will be used to create default metadata of the component */
  service: string;
  config?: OverviewConfiguration;
  /** add button component. The presence of the addButtonNode will lead to the ignorance of addButton in config */
  addButtonNode?: ReactNode;

  /** description component. The presence of the descriptionNode will lead to the ignorance of description in config */
  descriptionNode?: ReactNode;
  testId?: string;

  extra?: ReactNode;
}

export const createAddButtonComponent = (config: AddButtonConfig, service: string): ReactNode => {
  return (
    <GoabButton
      type="primary"
      disabled={config?.disabled === true}
      onClick={config?.onClickCallback}
      testId={config?.testId || `overall-${service}-add-btn`}
    >
      {config?.text || `Add ${service}`}
    </GoabButton>
  );
};

export const createDescriptionComponent = (config: DescriptionConfig): ReactNode => {
  return (
    <section className={`${config.class}`}>
      {config?.content instanceof Array &&
        config.content.map((line) => {
          return <p>{line}</p>;
        })}

      {typeof config?.content === 'string' && <p>{config.content}</p>}
    </section>
  );
};

export const Overview = (props: OverviewProps): JSX.Element => {
  const descriptionComponent: ReactNode =
    props?.descriptionNode || (props?.config?.description && createDescriptionComponent(props?.config?.description));
  const AddButtonComponent: ReactNode =
    props?.addButtonNode ||
    (props?.config?.addButton && createAddButtonComponent(props?.config?.addButton, props.service));

  const testId = props?.testId || `${props?.service}-service-overall`;

  return (
    <OverviewLayout
      testId={testId}
      description={descriptionComponent}
      addButton={AddButtonComponent}
      extra={props.extra}
    />
  );
};
