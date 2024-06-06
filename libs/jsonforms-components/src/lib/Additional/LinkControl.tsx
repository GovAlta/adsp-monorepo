import React, { useEffect, useState } from 'react';
import { isValidUrl } from '../Context/register/util';
import { GoAFormItem } from '@abgov/react-components-new';
import { GoAIconButton } from '@abgov/react-components-new';

const linkLength = 40;
const invalidExtensions = ['exe'];

export interface OptionProps {
  ariaLabel?: string;
  help?: string | string[];
  variant?: string;
  img?: string;
  alt?: string;
  height?: string;
  width?: string;
  link?: string;
}

export const RenderLink = (props: OptionProps): JSX.Element => {
  const { link, help } = props;

  const [linkValid, setLinkValid] = useState<boolean | null>(null);
  let error = undefined;

  let linkLabel = link && link?.length > linkLength ? `${link?.slice(0, linkLength)}...` : link;
  let linkUrl = link as string;

  if (help) {
    linkLabel = help as string;
  }

  const count = link?.split('.')?.length || 0;
  const extension = link?.split('.')[count - 1];

  if (invalidExtensions.includes(extension || '')) {
    linkUrl = '';
    linkLabel = '';
    error = `Invalid extension: ${extension}`;
  }

  useEffect(() => {
    if (linkUrl) {
      setLinkValid(isValidUrl(linkUrl));
    }
  }, [linkUrl]);

  if (!linkLabel && !error) {
    linkLabel = 'Link';
  }
  if (linkValid === false) {
    linkLabel = '';
    error = 'Invalid Link';
  }
  return (
    <GoAFormItem error={error} label="">
      <div data-testid="link-jsonform">
        {linkUrl && linkValid ? (
          <div>
            <a href={link} rel="noopener noreferrer" target="_blank">
              {linkLabel as string}
              <GoAIconButton icon="open" title="Open" testId="open-icon" size="small" />
            </a>
          </div>
        ) : (
          linkLabel
        )}
      </div>
    </GoAFormItem>
  );
};
