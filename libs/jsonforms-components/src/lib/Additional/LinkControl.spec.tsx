import React from 'react';
import { render, waitFor, getByText, queryByText } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RenderLink, OptionProps } from './LinkControl';
import { ControlElement } from '@jsonforms/core';
import { validateUrl } from '../Context/register/util';

jest.mock('../Context/register/util');

describe('LinkSelect component', () => {
  const staticProps: OptionProps = {
    help: undefined,
    link: 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/2bfb6ff5-d246-4b76-8267-548ed58bf339/download/agi-alberta-farm-fuel-benefit-program-fuel-tax-exemption-application-2023.pdf',
  };

  describe('can create LinkSelect component', () => {
    afterEach(() => {
      (validateUrl as jest.Mock).mockReset();
    });
    it('renders basic LinkSelect component with link only', () => {
      const props = { ...staticProps };
      const component = render(<RenderLink {...props} />);
      expect(component.getByText('https://open.alberta.ca/dataset/70c50877...')).toBeInTheDocument();
    });
    it('renders LinkSelect component with link and name', () => {
      const props = { ...staticProps, link: undefined, help: 'Alberta Farm' };
      const component = render(<RenderLink {...props} />);
      expect(component.getByText('Alberta Farm')).toBeInTheDocument();
    });

    it('renders invalid extension if extension ends with exe', async () => {
      const Link = 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/abc.exe';

      const props = { ...staticProps, link: Link };

      (validateUrl as jest.Mock).mockResolvedValueOnce(true);

      const { container } = render(<RenderLink {...props} />);
      await waitFor(() => {
        const anchorElement = container.querySelector(`a[href="${Link}"]`);
        const LinkText = queryByText(container, 'Alberta Farm');
        const ErrorLinkText = container?.querySelector('goa-form-item')?.getAttribute('error');

        expect(anchorElement).not.toBeInTheDocument();
        expect(LinkText).not.toBeInTheDocument();
        expect(ErrorLinkText).toEqual('Invalid extension: exe');
      });
    });

    it('renders invalid link if we do not get a response by calling the url', async () => {
      const Link = 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/abc.pdf';

      const props = { ...staticProps, link: Link };

      // Fails to validate url = bad url
      (validateUrl as jest.Mock).mockResolvedValueOnce(false);

      const { container } = render(<RenderLink {...props} />);
      await waitFor(() => {
        const anchorElement = container.querySelector(`a[href="${Link}"]`);
        const LinkText = queryByText(container, 'Alberta Farm');
        const ErrorLinkText = container?.querySelector('goa-form-item')?.getAttribute('error');

        expect(anchorElement).not.toBeInTheDocument();
        expect(LinkText).not.toBeInTheDocument();
        expect(ErrorLinkText).toEqual('Invalid Link');
      });
    });
  });
});
