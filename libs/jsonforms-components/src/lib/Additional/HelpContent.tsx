/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoADetails } from '@abgov/react-components-new';
import { HelpContentDiv } from './styled-components';
import { ControlProps, ControlElement } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Visible } from '../util';
import { RenderLink } from './LinkControl';

interface OptionProps {
  ariaLabel?: string;
  help?: string | string[];
  variant?: string;
  url?: string;
  alt?: string;
  height?: string;
  width?: string;
  link?: string;
}

interface CustomControlElement extends ControlElement {
  options?: OptionProps;
  elements?: CustomControlElement[]; // Assuming elements is an array of similar objects
}

interface CustomControlProps extends ControlProps {
  uischema: CustomControlElement;
}

export const HelpContentComponent = ({
  isParent = true,
  ...props
}: CustomControlProps & { isParent?: boolean }): JSX.Element => {
  const labelClass = isParent ? 'parent-label' : 'child-label';
  const marginClass = isParent ? 'parent-margin' : 'child-margin';
  // eslint-disable-next-line
  const { uischema, visible, label } = props;
  const link = uischema?.options?.link;
  const renderHelp = () =>
    Array.isArray(uischema?.options?.help) ? (
      <ul>
        {uischema?.options?.help.map((line: string, index: number) => (
          <li key={index}>{`${line}`}</li>
        ))}
      </ul>
    ) : (
      <p className="single-line">{uischema?.options?.help}</p>
    );

  const renderImage = ({ height, width, alt, url }: OptionProps): JSX.Element => {
    return <img src={url} width={width} height={height} alt={alt} />;
  };

  const isLinkOrImageVariant = (variant: string | undefined) => {
    const types = ['img', 'link'];
    return !types.includes(variant ?? '');
  };

  return (
    <Visible visible={visible}>
      <HelpContentDiv aria-label={uischema.options?.ariaLabel}>
        <div className={marginClass}>
          {label && !uischema.options?.variant && uischema.options?.variant !== 'details' && (
            <div className={labelClass} data-testid={label}>
              {label}
              <br />
            </div>
          )}

          {uischema.options?.variant && uischema.options?.variant === 'img' && renderImage(uischema.options)}
          {uischema?.options?.link && link !== '' && RenderLink(uischema?.options)}
          {(!uischema.options?.variant || uischema.options?.variant !== 'details') &&
            !isLinkOrImageVariant(uischema.options?.variant) &&
            renderHelp()}
          {uischema.options?.variant && uischema.options?.variant === 'details' && (
            <GoADetails heading={label ? label : ''} mt="3xs" mb="none">
              {renderHelp()}
              {uischema?.elements && uischema?.elements?.length > 0 && <HelpContents elements={uischema?.elements} />}
            </GoADetails>
          )}
          {uischema?.elements && uischema?.elements.length > 0 && uischema.options?.variant !== 'details' && (
            <HelpContents elements={uischema.elements} isParent={false} />
          )}
        </div>
      </HelpContentDiv>
    </Visible>
  );
};

const HelpContents = ({ elements, isParent = false }: { elements: CustomControlElement[]; isParent?: boolean }) => (
  <div>
    {elements?.map((element: any) => {
      return (
        <HelpContentComponent
          uischema={element}
          label={element.label}
          errors={''}
          data={undefined}
          enabled={false}
          visible={true}
          path={''}
          handleChange={(): void => {}}
          rootSchema={{}}
          id={''}
          schema={{}}
          isParent={isParent}
        />
      );
    })}
  </div>
);

export const HelpContentTester: RankedTester = rankWith(1, uiTypeIs('HelpContent'));

export const HelpContent = withJsonFormsControlProps(HelpContentComponent);
