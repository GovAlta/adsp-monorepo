import React, { useEffect, useState } from 'react';
import { ControlProps, RankedTester, rankWith, scopeEndsWith } from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import { WithInputProps } from '../Inputs/type';
import { WithOptionLabel } from '../../util';
import { WithClassname } from '@jsonforms/core';
import { validateUrl } from '../../Context/register/util';
import { GoAFormItem } from '@abgov/react-components-new';

export type LinkSelectProps = WithClassname & TranslateProps & WithInputProps & ControlProps;

const linkLength = 40;
const invalidExtensions = ['exe'];

export const LinkSelect = (props: LinkSelectProps): JSX.Element => {
  const componentProps = props?.uischema?.options?.componentProps;

  const { link, label, heading, description } = componentProps;

  const [linkValid, setLinkValid] = useState<boolean | null>(null);
  let error = undefined;

  let linkLabel = link?.length > linkLength ? `${link?.slice(0, linkLength)}...` : link;
  let linkUrl = link;

  if (label) {
    linkLabel = label;
  }

  const count = link?.split('.').length;
  const extension = link?.split('.')[count - 1];

  if (invalidExtensions.includes(extension)) {
    linkUrl = null;
    linkLabel = '';
    error = `Invalid extension: ${extension}`;
  }

  useEffect(() => {
    async function validateLink(linkUrl: string) {
      if (linkUrl) {
        const response = await validateUrl({ url: linkUrl });
        setLinkValid(response);
      }
    }
    validateLink(linkUrl);
  }, [linkUrl]);

  if (!linkLabel && !error) {
    linkLabel = 'Link';
  }
  if (linkValid === false) {
    linkLabel = '';
    error = 'Invalid Link';
  }
  return (
    <GoAFormItem error={error} label={heading}>
      <div data-testid="link-jsonform">
        {description && <div>{description}</div>}
        {linkUrl && linkValid ? (
          <a href={link} target="_blank" rel="noreferrer">
            {linkLabel}
          </a>
        ) : (
          linkLabel
        )}
      </div>
    </GoAFormItem>
  );
};

export const linkControl = (props: ControlProps & WithOptionLabel & TranslateProps) => {
  return <LinkSelect {...props} />;
};

export const GoALinkControlTester: RankedTester = rankWith(2, scopeEndsWith('link'));
