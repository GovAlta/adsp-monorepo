/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { GoabDetails } from '@abgov/react-components';
import { HelpContentDiv, InvalidMarkdown } from './styled-components';
import { ControlProps, ControlElement } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Visible } from '../util';
import { RenderLink } from './LinkControl';
import { compileSync, createProcessor, evaluateSync } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import './HelpContent.css';

interface OptionProps {
  ariaLabel?: string;
  help?: string | string[];
  variant?: string;
  src?: string;
  alt?: string;
  height?: string;
  width?: string;
  link?: string;
  markdown?: boolean;
}

interface CustomControlElement extends ControlElement {
  options?: OptionProps;
  elements?: CustomControlElement[]; // Assuming elements is an array of similar objects
}

interface ExtraHelpContentProps {
  isParent?: boolean;
  showLabel?: boolean;
}

interface CustomControlProps extends ControlProps {
  uischema: CustomControlElement;
}

interface MdxMarkdown {
  markdown: string;
}

interface MdxMarkdownResponse {
  isValid: boolean;
  error: string;
}

const HelpContentReviewComponent = (): JSX.Element => {
  return <> </>;
};

const checkMarkDownIsValid = (markdown: string): MdxMarkdownResponse => {
  let isValid = true;
  let error: string = '';
  try {
    compileSync(markdown, {});
  } catch (err) {
    if (err instanceof Error) {
      error = err.message;
      error = error.slice(0, error.lastIndexOf(`\``) + 1);
    }
    isValid = false;
  }
  return { isValid, error };
};
export const MarkdownComponent = ({ markdown }: MdxMarkdown): JSX.Element => {
  const response = checkMarkDownIsValid(markdown);
  if (response.isValid) {
    const { default: MDXContent } = evaluateSync(markdown, { ...runtime, Fragment: React.Fragment });
    return React.createElement(MDXContent, {});
  }
  return <InvalidMarkdown>Help content markdown is invalid: {response.error} </InvalidMarkdown>;
};

export const HelpContentComponent = ({
  isParent = true,
  showLabel = true,
  ...props
}: CustomControlProps & ExtraHelpContentProps): JSX.Element => {
  const labelClass = isParent ? 'parent-label' : 'child-label';
  const marginClass = isParent ? 'parent-margin' : 'child-margin';
  // eslint-disable-next-line
  const { uischema, visible, label } = props;
  const link = uischema?.options?.link;
  const markdown = uischema?.options?.markdown ?? false;
  const help = uischema?.options?.help;

  const renderHelp = () =>
    Array.isArray(help) ? (
      <ul>
        {help.map((line: string, index: number) => (
          <li className="help-content-markdown" key={index}>{`${line}`}</li>
        ))}
      </ul>
    ) : (
      <p className="single-line">{help}</p>
    );

  const renderImage = ({ height, width, alt, src }: OptionProps): JSX.Element => {
    return (
      <img
        src={src}
        width={width}
        height={height}
        alt={alt || 'help-content-toggle-icon'}
        aria-label="help-content-toggle-icon"
      />
    );
  };

  /* istanbul ignore next */
  const getMarkDownData = (helpText: string | string[] | undefined) => {
    if (helpText === undefined) return '';
    if (typeof helpText === 'string') return helpText;

    if (Array.isArray(helpText)) {
      //Two spaces after the text inserts a line break in markdown.
      const data = helpText.join('  \n');
      return data;
    }

    return '';
  };

  const textVariant =
    !uischema.options?.variant ||
    (uischema.options?.variant !== 'details' && uischema.options?.variant !== 'hyperlink');

  if (markdown) {
    return (
      <Visible visible={visible}>
        <div className="help-content-markdown">
          {MarkdownComponent({ markdown: getMarkDownData(uischema?.options?.help) })}
        </div>
      </Visible>
    );
  }
  return (
    <Visible visible={visible}>
      <HelpContentDiv aria-label={uischema.options?.ariaLabel}>
        <div className={`help-content-markdown ${marginClass}`}>
          {label && showLabel && (!uischema.options?.variant || uischema.options?.variant === 'hyperlink') && (
            <div className={labelClass} data-testid={label}>
              {label}
              <br />
            </div>
          )}

          {uischema.options?.variant && uischema.options?.variant === 'img' && renderImage(uischema.options)}
          {uischema?.options?.variant &&
            uischema.options?.variant === 'hyperlink' &&
            link &&
            RenderLink(uischema?.options)}
          {textVariant && renderHelp()}
          {uischema.options?.variant && uischema.options?.variant === 'details' && (
            <GoabDetails heading={label ? label : ''} mt="3xs" mb="none">
              {renderHelp()}
              {uischema?.elements && uischema?.elements?.length > 0 && <HelpContents elements={uischema?.elements} />}
            </GoabDetails>
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
    {elements?.map((element: any, index) => {
      return (
        <HelpContentComponent
          uischema={element}
          label={element.label}
          errors={''}
          key={`${element.label}-help-content-${index}`}
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
export const HelpReviewContent = withJsonFormsControlProps(HelpContentReviewComponent);
